import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FriendsFeature } from "@/components/features/friends";
import { currentUser } from "@/lib/auth";
export default async function Page() { const user = await currentUser(); if (!user) redirect("/auth"); return <AppShell user={user}><FriendsFeature /></AppShell>; }
