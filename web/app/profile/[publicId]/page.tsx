import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PublicProfile } from "@/components/features/public-profile";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendshipBetween } from "@/lib/social";

function ageFromBirthDate(date: Date | null) {
  if (!date) return null; const now = new Date(); let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
  return age;
}

export default async function ProfilePage({ params }: { params: Promise<{ publicId: string }> }) {
  const viewer = await currentUser(); if (!viewer) redirect("/auth"); const { publicId } = await params;
  const profile = await db.user.findUnique({ where: { publicId }, select: { id: true, publicId: true, username: true, firstName: true, lastName: true, bio: true, birthDate: true, avatarUrl: true, profileVisibility: true, logbookVisibility: true, createdAt: true } });
  if (!profile) notFound(); const self = viewer.id === profile.id; const friendship = self ? null : await friendshipBetween(viewer.id, profile.id); const accepted = friendship?.status === "ACCEPTED"; const full = self || accepted || profile.profileVisibility === "PUBLIC";
  const [dives, plans, reviews] = full ? await Promise.all([
    db.dive.findMany({ where: { userId: profile.id, ...(self ? {} : { visibility: "PUBLIC", user: { logbookVisibility: "PUBLIC" } }) }, orderBy: { date: "desc" }, take: 30, include: { photos: { select: { id: true } } } }),
    db.plannedDive.findMany({ where: { userId: profile.id, plannedUntil: { gte: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`) }, ...(self ? {} : { visibility: "PUBLIC" }) }, orderBy: { plannedFor: "asc" }, take: 20 }),
    db.siteReview.findMany({ where: { userId: profile.id }, orderBy: { createdAt: "desc" }, take: 20, include: { photos: { select: { id: true } } } }),
  ]) : [[], [], []];
  const data = { publicId: profile.publicId, username: profile.username, firstName: full ? profile.firstName : null, lastName: full ? profile.lastName : null, bio: full ? profile.bio : null, avatarUrl: full ? profile.avatarUrl : null, age: full ? ageFromBirthDate(profile.birthDate) : null, createdAt: profile.createdAt.toISOString(), full, self, relationship: friendship ? { status: friendship.status, incoming: friendship.recipientId === viewer.id } : null, dives: dives.map((dive) => ({ ...dive, date: dive.date.toISOString(), createdAt: undefined, updatedAt: undefined, userId: undefined })), plans: plans.map((plan) => ({ ...plan, plannedFor: plan.plannedFor.toISOString(), plannedUntil: plan.plannedUntil.toISOString(), createdAt: undefined, updatedAt: undefined, userId: undefined })), reviews: reviews.map((review) => ({ ...review, createdAt: undefined, updatedAt: undefined, userId: undefined })) };
  return <AppShell user={viewer}><PublicProfile profile={data} /></AppShell>;
}
