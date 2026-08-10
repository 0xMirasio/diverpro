import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId(); if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params; const body = await request.json().catch(() => null) as { visibility?: unknown } | null;
  if (body?.visibility !== "PUBLIC" && body?.visibility !== "PRIVATE") return apiError("INVALID_INPUT", 400);
  const result = await db.plannedDive.updateMany({ where: { id, userId }, data: { visibility: body.visibility } });
  if (!result.count) return apiError("NOT_FOUND", 404); return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const result = await db.plannedDive.deleteMany({ where: { id, userId } });
  if (!result.count) return apiError("NOT_FOUND", 404);
  return NextResponse.json({ ok: true });
}
