import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProfileSettingsFeature } from "@/components/features/profile-settings";
import { currentUser } from "@/lib/auth";
export default async function Page() { const user = await currentUser(); if (!user) redirect("/auth"); return <AppShell user={user}><ProfileSettingsFeature user={user} /></AppShell>; }
