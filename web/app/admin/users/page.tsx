import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminUsersFeature } from "@/components/features/admin-users";
import { currentUser } from "@/lib/auth";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/auth");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return <AppShell user={user}><AdminUsersFeature /></AppShell>;
}
