import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/components/features/dashboard-overview";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await currentUser(); if (!user) redirect("/auth");
  const [diveAggregate, plans, friendships, reviews] = await Promise.all([
    db.dive.aggregate({ where: { userId: user.id }, _sum: { groupCount: true } }), db.plannedDive.count({ where: { userId: user.id, plannedUntil: { gte: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`) } } }),
    db.friendship.count({ where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { recipientId: user.id }] } }), db.siteReview.count({ where: { userId: user.id } }),
  ]);
  return <AppShell user={user}><DashboardOverview user={user} counts={{ dives: diveAggregate._sum.groupCount ?? 0, plans, friendships, reviews }} /></AppShell>;
}
