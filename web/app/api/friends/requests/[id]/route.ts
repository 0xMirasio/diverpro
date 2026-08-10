import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "accept" && body?.action !== "decline") return apiError("INVALID_INPUT", 400);
  const result = await db.friendship.updateMany({
    where: { id, recipientId: userId, status: "PENDING" },
    data: { status: body.action === "accept" ? "ACCEPTED" : "DECLINED" },
  });
  if (!result.count) return apiError("REQUEST_NOT_FOUND", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const result = await db.friendship.deleteMany({
    where: { id, status: "ACCEPTED", OR: [{ requesterId: userId }, { recipientId: userId }] },
  });
  if (!result.count) return apiError("FRIENDSHIP_NOT_FOUND", 404);
  return NextResponse.json({ ok: true });
}
