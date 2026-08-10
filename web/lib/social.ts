import { db } from "@/lib/db";

export async function acceptedFriendIds(userId: string) {
  const rows = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { recipientId: userId }],
    },
    select: { requesterId: true, recipientId: true },
  });
  return rows.map((row) => (row.requesterId === userId ? row.recipientId : row.requesterId));
}

export async function friendshipBetween(firstId: string, secondId: string) {
  return db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: firstId, recipientId: secondId },
        { requesterId: secondId, recipientId: firstId },
      ],
    },
  });
}

export async function areFriends(firstId: string, secondId: string) {
  if (firstId === secondId) return true;
  const friendship = await friendshipBetween(firstId, secondId);
  return friendship?.status === "ACCEPTED";
}
