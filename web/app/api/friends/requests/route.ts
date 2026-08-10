import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUsername } from "@/lib/user-identity";
import { friendshipBetween } from "@/lib/social";

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const body = await request.json().catch(() => null) as { identifier?: unknown } | null;
  if (!body || typeof body.identifier !== "string") return apiError("INVALID_INPUT", 400);
  const identifier = body.identifier.trim();
  const recipient = await db.user.findFirst({
    where: { OR: [{ publicId: identifier.toLowerCase() }, { usernameKey: normalizeUsername(identifier) }] },
    select: { id: true, publicId: true },
  });
  if (!recipient) return apiError("DIVER_NOT_FOUND", 404);
  if (recipient.id === userId) return apiError("CANNOT_ADD_SELF", 400);
  const existing = await friendshipBetween(userId, recipient.id);
  if (existing?.status === "ACCEPTED") return apiError("ALREADY_FRIENDS", 409);
  if (existing?.status === "PENDING") return apiError(existing.recipientId === userId ? "INCOMING_REQUEST_EXISTS" : "REQUEST_EXISTS", 409);
  const requestRow = existing
    ? await db.friendship.update({
        where: { id: existing.id },
        data: { requesterId: userId, recipientId: recipient.id, status: "PENDING" },
      })
    : await db.friendship.create({ data: { requesterId: userId, recipientId: recipient.id } });
  return NextResponse.json({ request: { id: requestRow.id, recipientPublicId: recipient.publicId } }, { status: 201 });
}
