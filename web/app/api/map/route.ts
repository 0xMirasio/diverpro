import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptedFriendIds } from "@/lib/social";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const friendIds = await acceptedFriendIds(userId);
  const userSelect = { publicId: true, username: true, profileVisibility: true } as const;
  const [dives, plans, reviews] = await Promise.all([
    db.dive.findMany({
      where: {
        latitude: { not: null }, longitude: { not: null },
        OR: [
          { userId },
          { userId: { in: friendIds }, visibility: "PUBLIC", user: { logbookVisibility: "PUBLIC" } },
        ],
      },
      include: { user: { select: userSelect } },
      orderBy: { date: "desc" }, take: 500,
    }),
    db.plannedDive.findMany({
      where: {
        latitude: { not: null }, longitude: { not: null }, plannedUntil: { gte: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`) },
        OR: [{ userId }, { userId: { in: friendIds }, visibility: "PUBLIC" }],
      },
      include: { user: { select: userSelect } },
      orderBy: { plannedFor: "asc" }, take: 500,
    }),
    db.siteReview.findMany({
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" }, take: 500,
    }),
  ]);
  const owner = (item: { userId: string; user: { publicId: string; username: string; profileVisibility: string } }) =>
    item.userId === userId || friendIds.includes(item.userId) || item.user.profileVisibility === "PUBLIC"
      ? { publicId: item.user.publicId, username: item.user.username }
      : { publicId: null, username: null };
  const source = (item: { userId: string }) => item.userId === userId ? "self" : friendIds.includes(item.userId) ? "friend" : "community";
  return NextResponse.json({
    points: [
      ...dives.map((dive) => ({ id: dive.id, type: "dive", source: source(dive), siteName: dive.siteName, latitude: dive.latitude, longitude: dive.longitude, date: dive.date, visibility: dive.visibility, owner: owner(dive) })),
      ...plans.map((plan) => ({ id: plan.id, type: "plan", source: source(plan), siteName: plan.siteName, latitude: plan.latitude, longitude: plan.longitude, date: plan.plannedFor, endDate: plan.plannedUntil, visibility: plan.visibility, owner: owner(plan) })),
      ...reviews.map((review) => ({ id: review.id, type: "review", source: source(review), siteName: review.siteName, latitude: review.latitude, longitude: review.longitude, rating: review.rating, date: review.createdAt, owner: owner(review) })),
    ],
  });
}
