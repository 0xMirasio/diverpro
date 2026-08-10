"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned, UsersRound } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function AdminNavigation() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const labels = locale === "fr" ? ["Sites de plongée", "Utilisateurs"] : locale === "es" ? ["Sitios de buceo", "Usuarios"] : ["Dive sites", "Users"];
  return <nav className="admin-navigation" aria-label="Administration">
    <Link className={pathname === "/admin/sites" ? "active" : ""} href="/admin/sites"><MapPinned size={16} />{labels[0]}</Link>
    <Link className={pathname === "/admin/users" ? "active" : ""} href="/admin/users"><UsersRound size={16} />{labels[1]}</Link>
  </nav>;
}
