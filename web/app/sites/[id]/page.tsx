import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SiteDetailFeature } from "@/components/features/site-detail";
import { currentUser } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) redirect("/auth"); const { id } = await params;
  return <AppShell user={user}><SiteDetailFeature siteId={id} /></AppShell>;
}
