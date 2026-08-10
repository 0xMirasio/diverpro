import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMedia } from "@/lib/storage";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId(); if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params; const body = await request.json().catch(() => null) as { visibility?: unknown; groupCount?: unknown } | null;
  const data: { visibility?: "PUBLIC" | "PRIVATE"; groupCount?: number } = {};
  if (body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE") data.visibility = body.visibility;
  if (typeof body?.groupCount === "number" && Number.isInteger(body.groupCount) && body.groupCount >= 1 && body.groupCount <= 100) data.groupCount = body.groupCount;
  if (!Object.keys(data).length) return apiError("INVALID_INPUT", 400);
  const result = await db.dive.updateMany({ where: { id, userId }, data });
  if (!result.count) return apiError("NOT_FOUND", 404); return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const dive = await db.dive.findFirst({
    where: { id, userId },
    select: { id: true, photos: { select: { storageKey: true } } },
  });
  if (!dive) return apiError("NOT_FOUND", 404);
  await db.dive.delete({ where: { id: dive.id } });
  await Promise.all(dive.photos.map((photo) => deleteMedia(photo.storageKey).catch(() => undefined)));
  return NextResponse.json({ ok: true });
}
