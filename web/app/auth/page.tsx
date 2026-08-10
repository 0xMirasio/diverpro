import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { AuthHero } from "@/components/auth-hero";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { currentUser } from "@/lib/auth";
import { SiteFooter } from "@/components/site-footer";

export default async function AuthPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <main className="auth-page">
      <div className="auth-backdrop" />
      <header className="auth-header">
        <Brand />
        <LanguageSwitcher />
      </header>
      <section className="auth-layout">
        <AuthHero />
        <AuthPanel />
      </section>
      <SiteFooter variant="overlay" />
    </main>
  );
}
