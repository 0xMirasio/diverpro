import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminSitesFeature } from "@/components/features/admin-sites";
import { currentUser } from "@/lib/auth";

export default async function Page() {
  const user = await currentUser(); if (!user) redirect("/auth"); if (user.role !== "ADMIN") redirect("/dashboard");
  return <AppShell user={user}><AdminSitesFeature /></AppShell>;
}
