import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const site = await db.diveSite.findUnique({
    where: { id },
    include: { reviews: { orderBy: { createdAt: "desc" }, include: { photos: { select: { id: true } }, user: { select: { publicId: true, username: true, profileVisibility: true } } } }, _count: { select: { reviews: true } } },
  });
  if (!site) return apiError("NOT_FOUND", 404);
  return NextResponse.json({ site: { ...site, description: site.description || site.sourceDescription, reviews: site.reviews.map((review) => ({ ...review, user: review.user.profileVisibility === "PUBLIC" ? review.user : { publicId: null, username: null } })) } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actorId = await sessionUserId(); if (!actorId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params; const body = await request.json().catch(() => null) as { description?: unknown } | null;
  if (typeof body?.description !== "string" || body.description.trim().length > 6000) return apiError("INVALID_INPUT", 400);
  const existing = await db.diveSite.findUnique({ where: { id }, select: { description: true } }); if (!existing) return apiError("NOT_FOUND", 404);
  const description = body.description.trim() || null;
  const site = await db.$transaction(async (tx) => {
    const updated = await tx.diveSite.update({ where: { id }, data: { description } });
    await tx.siteChangeLog.create({ data: { siteId: id, actorId, action: "DESCRIPTION_UPDATED", before: { description: existing.description }, after: { description } } });
    return updated;
  });
  return NextResponse.json({ site });
}
