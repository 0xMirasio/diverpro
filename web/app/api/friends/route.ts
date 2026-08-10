import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

const diverSelect = { publicId: true, username: true, firstName: true, lastName: true, avatarUrl: true } as const;

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const rows = await db.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: { requester: { select: diverSelect }, recipient: { select: diverSelect } },
  });
  return NextResponse.json({
    friends: rows.filter((row) => row.status === "ACCEPTED").map((row) => ({ friendshipId: row.id, ...(row.requesterId === userId ? row.recipient : row.requester) })),
    incoming: rows.filter((row) => row.status === "PENDING" && row.recipientId === userId).map((row) => ({ requestId: row.id, ...row.requester })),
    outgoing: rows.filter((row) => row.status === "PENDING" && row.requesterId === userId).map((row) => ({ requestId: row.id, ...row.recipient })),
  });
}
