import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PlanningFeature } from "@/components/features/planning";
import { currentUser } from "@/lib/auth";
export default async function Page() { const user = await currentUser(); if (!user) redirect("/auth"); return <AppShell user={user}><PlanningFeature /></AppShell>; }
