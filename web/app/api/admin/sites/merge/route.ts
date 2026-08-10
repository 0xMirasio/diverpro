import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { adminUser } from "@/lib/admin";
import { db } from "@/lib/db";

const schema = z.object({ duplicateId: z.string().uuid(), targetId: z.string().uuid() }).refine((value) => value.duplicateId !== value.targetId);

export async function POST(request: Request) {
  const actor = await adminUser(); if (!actor) return apiError("FORBIDDEN", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("INVALID_INPUT", 400);
  const { duplicateId, targetId } = parsed.data;
  const [duplicate, target] = await Promise.all([db.diveSite.findUnique({ where: { id: duplicateId } }), db.diveSite.findUnique({ where: { id: targetId } })]);
  if (!duplicate || !target) return apiError("NOT_FOUND", 404);
  await db.$transaction(async (tx) => {
    await tx.siteReview.updateMany({ where: { siteId: duplicateId }, data: { siteId: targetId, siteName: target.name, latitude: target.latitude, longitude: target.longitude } });
    await tx.siteChangeLog.create({ data: { siteId: targetId, actorId: actor.id, action: "SITE_MERGED", before: { duplicateId, duplicateName: duplicate.name }, after: { targetId, targetName: target.name } } });
    await tx.diveSite.delete({ where: { id: duplicateId } });
  });
  return NextResponse.json({ ok: true });
}
