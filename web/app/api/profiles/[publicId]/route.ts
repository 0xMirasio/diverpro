import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendshipBetween } from "@/lib/social";

function ageFromBirthDate(date: Date | null) {
  if (!date) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
  return age;
}

export async function GET(_: Request, context: { params: Promise<{ publicId: string }> }) {
  const viewer = await currentUser();
  if (!viewer) return apiError("UNAUTHENTICATED", 401);
  const { publicId } = await context.params;
  const profile = await db.user.findUnique({
    where: { publicId: publicId.toLowerCase() },
    select: {
      id: true, publicId: true, username: true, firstName: true, lastName: true,
      bio: true, birthDate: true, avatarUrl: true, profileVisibility: true,
      logbookVisibility: true, createdAt: true,
    },
  });
  if (!profile) return apiError("NOT_FOUND", 404);

  const self = viewer.id === profile.id;
  const friendship = self ? null : await friendshipBetween(viewer.id, profile.id);
  const accepted = friendship?.status === "ACCEPTED";
  const full = self || accepted || profile.profileVisibility === "PUBLIC";
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const [dives, plans, reviews] = full ? await Promise.all([
    db.dive.findMany({
      where: { userId: profile.id, ...(self ? {} : { visibility: "PUBLIC", user: { logbookVisibility: "PUBLIC" } }) },
      orderBy: { date: "desc" }, take: 30, include: { photos: { select: { id: true } } },
    }),
    db.plannedDive.findMany({
      where: { userId: profile.id, plannedUntil: { gte: today }, ...(self ? {} : { visibility: "PUBLIC" }) },
      orderBy: { plannedFor: "asc" }, take: 20,
    }),
    db.siteReview.findMany({
      where: { userId: profile.id }, orderBy: { createdAt: "desc" }, take: 20,
      include: { photos: { select: { id: true } } },
    }),
  ]) : [[], [], []];

  return NextResponse.json({
    profile: {
      publicId: profile.publicId,
      username: profile.username,
      firstName: full ? profile.firstName : null,
      lastName: full ? profile.lastName : null,
      bio: full ? profile.bio : null,
      avatarUrl: full ? profile.avatarUrl : null,
      age: full ? ageFromBirthDate(profile.birthDate) : null,
      createdAt: profile.createdAt,
      full,
      self,
      relationship: friendship ? { id: friendship.id, status: friendship.status, incoming: friendship.recipientId === viewer.id } : null,
      dives,
      plans,
      reviews,
    },
  });
}
