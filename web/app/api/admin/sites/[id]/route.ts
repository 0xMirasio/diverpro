import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { adminUser } from "@/lib/admin";
import { db } from "@/lib/db";
import { normalizeSiteName } from "@/lib/dive-sites";

const schema = z.object({ name: z.string().trim().min(2).max(160), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), description: z.string().trim().max(6000) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await adminUser(); if (!actor) return apiError("FORBIDDEN", 403); const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("INVALID_INPUT", 400);
  const before = await db.diveSite.findUnique({ where: { id }, select: { name: true, latitude: true, longitude: true, description: true } }); if (!before) return apiError("NOT_FOUND", 404);
  const input = parsed.data; const site = await db.$transaction(async (tx) => {
    const updated = await tx.diveSite.update({ where: { id }, data: { ...input, description: input.description || null, normalizedName: normalizeSiteName(input.name) } });
    await tx.siteChangeLog.create({ data: { siteId: id, actorId: actor.id, action: "SITE_UPDATED", before, after: input } }); return updated;
  });
  return NextResponse.json({ site });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await adminUser(); if (!actor) return apiError("FORBIDDEN", 403); const { id } = await context.params;
  const site = await db.diveSite.findUnique({ where: { id }, include: { _count: { select: { reviews: true } } } }); if (!site) return apiError("NOT_FOUND", 404);
  if (site._count.reviews) return apiError("SITE_HAS_REVIEWS", 409);
  await db.$transaction(async (tx) => { await tx.siteChangeLog.create({ data: { siteId: id, actorId: actor.id, action: "SITE_DELETED", before: { id, name: site.name, latitude: site.latitude, longitude: site.longitude } } }); await tx.diveSite.delete({ where: { id } }); });
  return NextResponse.json({ ok: true });
}
