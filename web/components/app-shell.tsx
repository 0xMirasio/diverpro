"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenText, Compass, LayoutDashboard, LogOut, Map, MessageSquareMore, Route, Settings, ShieldCheck, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import { SiteFooter } from "@/components/site-footer";

export type ShellUser = { firstName: string; lastName: string; username: string; publicId: string; avatarUrl?: string | null; locale: string; role: "USER" | "ADMIN" };

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const c = featureCopy(locale);
  const nav: Array<readonly [string, string, LucideIcon]> = [
    ["/dashboard", c.navHome, LayoutDashboard], ["/logbook", c.navLogbook, BookOpenText],
    ["/friends", c.navFriends, UsersRound], ["/map", c.navMap, Map],
    ["/planning", c.navPlanning, Route], ["/reviews", c.navReviews, MessageSquareMore],
    ["/settings/profile", c.navProfile, Settings],
  ];
  if (user.role === "ADMIN") nav.push(["/admin/sites", c.navAdmin, ShieldCheck]);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const preferredLocaleApplied = useRef(false);

  useEffect(() => { if (!preferredLocaleApplied.current) { preferredLocaleApplied.current = true; if (["en", "fr", "es"].includes(user.locale) && locale !== user.locale) setLocale(user.locale as typeof locale); } }, [locale, setLocale, user.locale]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth"); router.refresh();
  }

  return (
    <main className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-brand"><Brand compact /></div>
        <nav className="app-nav">
          {nav.map(([href, label, Icon]) => (
            <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon size={18} /><span>{label}</span></Link>
          ))}
        </nav>
        <div className="sidebar-depth"><Compass size={26} /><span>BLUEMATES</span><small>{t.sidebarTagline}</small></div>
      </aside>
      <section className="app-main">
        <header className="app-topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="mobile-nav">
            {nav.map(([href, label, Icon]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon size={16} /><span>{label}</span></Link>)}
          </div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <Link className="topbar-profile" href={`/profile/${user.publicId}`}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{initials}</span>}
              <strong>@{user.username}</strong>
            </Link>
            <button className="topbar-logout" type="button" onClick={logout} title={c.logout}><LogOut size={17} /></button>
          </div>
        </header>
        <div className="app-content">{children}</div>
        <SiteFooter />
      </section>
    </main>
  );
}
