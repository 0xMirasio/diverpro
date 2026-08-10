"use client";

import Link from "next/link";
import { BookOpenText, CalendarClock, ChevronRight, MessageSquareMore, UsersRound } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import type { ShellUser } from "@/components/app-shell";
import { WorldMapFeature } from "@/components/features/world-map";

export function DashboardOverview({ user, counts }: { user: ShellUser; counts: { dives: number; plans: number; friendships: number; reviews: number } }) {
  const { locale, t } = useLanguage(); const c = featureCopy(locale);
  const cards = [
    ["/logbook", c.navLogbook, counts.dives, BookOpenText, "ocean"], ["/planning", c.navPlanning, counts.plans, CalendarClock, "aqua"],
    ["/friends", c.navFriends, counts.friendships, UsersRound, "navy"], ["/reviews", c.navReviews, counts.reviews, MessageSquareMore, "coral"],
  ] as const;
  return <div className="feature-page dashboard-overview"><header className="overview-hero"><div><span>{t.dashboardEyebrow}</span><h1>{t.dashboardGreeting}, {user.firstName}.</h1><p>{t.dashboardSub}</p></div></header><section className="metric-grid">{cards.map(([href, title, value, Icon, color]) => <Link className={`metric-card ${color}`} href={href} key={href}><span><Icon size={21} /></span><strong>{value}</strong><small>{title}</small><ChevronRight size={18} /></Link>)}</section><WorldMapFeature embedded /></div>;
}
