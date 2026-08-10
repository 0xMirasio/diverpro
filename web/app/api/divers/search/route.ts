import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ divers: [] });
  const users = await db.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { publicId: { contains: query.toLowerCase(), mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { username: "asc" },
    select: { id: true, publicId: true, username: true, firstName: true, lastName: true, avatarUrl: true, profileVisibility: true },
  });
  if (!users.length) return NextResponse.json({ divers: [] });
  const relationships = await db.friendship.findMany({
    where: {
      OR: users.flatMap((user) => [
        { requesterId: userId, recipientId: user.id },
        { requesterId: user.id, recipientId: userId },
      ]),
    },
  });
  return NextResponse.json({
    divers: users.map((user) => {
      const relationship = relationships.find((row) => row.requesterId === user.id || row.recipientId === user.id);
      const canShowName = user.profileVisibility === "PUBLIC" || relationship?.status === "ACCEPTED";
      return {
        publicId: user.publicId,
        username: user.username,
        firstName: canShowName ? user.firstName : null,
        lastName: canShowName ? user.lastName : null,
        avatarUrl: canShowName ? user.avatarUrl : null,
        relationship: relationship ? { id: relationship.id, status: relationship.status, incoming: relationship.recipientId === userId } : null,
      };
    }),
  });
}
