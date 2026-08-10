import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
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
        <div className="hero-copy" aria-hidden="true">
          <span className="depth-label">DISCOVER THE DEEP</span>
          <h1>Your ocean.<br />Your story.</h1>
          <div className="depth-line"><span /></div>
        </div>
        <AuthPanel />
      </section>
      <SiteFooter variant="overlay" />
    </main>
  );
}
