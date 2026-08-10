"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, ShieldCheck, UserRound } from "lucide-react";
import { FeatureHeader, Avatar } from "@/components/features/shared";
import { AdminNavigation } from "@/components/features/admin-navigation";
import { useLanguage } from "@/components/language-provider";

type AdminUser = {
  id: string; publicId: string; username: string; firstName: string; lastName: string; email: string;
  avatarUrl: string | null; role: string; locale: string; profileVisibility: string; logbookVisibility: string;
  birthDate: string | null; createdAt: string; updatedAt: string;
  _count: { dives: number; plannedDives: number; reviews: number; sentFriendships: number; receivedFriendships: number };
};

export function AdminUsersFeature() {
  const { locale } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const copy = locale === "fr"
    ? { title: "Utilisateurs", sub: "Consultez les comptes et leur profil public associé.", placeholder: "Pseudo, identifiant membre, nom ou e-mail", search: "Rechercher", profile: "Voir le profil", registered: "Inscrit le", dives: "plongées", plans: "projets", reviews: "avis", visibility: "Profil / carnet" }
    : locale === "es"
      ? { title: "Usuarios", sub: "Consulta las cuentas y su perfil público asociado.", placeholder: "Usuario, ID de miembro, nombre o correo", search: "Buscar", profile: "Ver perfil", registered: "Registrado", dives: "inmersiones", plans: "planes", reviews: "reseñas", visibility: "Perfil / diario" }
      : { title: "Users", sub: "Review accounts and their associated public profile.", placeholder: "Username, member ID, name or email", search: "Search", profile: "View profile", registered: "Registered", dives: "dives", plans: "plans", reviews: "reviews", visibility: "Profile / logbook" };

  async function load(q = query) {
    setLoading(true);
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    if (response.ok) setUsers((await response.json()).users);
    setLoading(false);
  }
  useEffect(() => { const controller = new AbortController(); void fetch("/api/admin/users", { signal: controller.signal }).then((response) => response.ok ? response.json() : { users: [] }).then((data) => { setUsers(data.users); setLoading(false); }).catch(() => undefined); return () => controller.abort(); }, []);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void load(); }

  return <div className="feature-page admin-users-page">
    <FeatureHeader eyebrow="BLUEMATES CONTROL" title={copy.title} subtitle={copy.sub} action={<ShieldCheck size={28} />} />
    <AdminNavigation />
    <form className="admin-site-search" onSubmit={submit}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.placeholder} /><button disabled={loading}>{copy.search}</button></form>
    <section className="admin-user-list">{users.map((user) => {
      const friendshipLinks = user._count.sentFriendships + user._count.receivedFriendships;
      return <article className="admin-user-card" key={user.id}>
        <Avatar url={user.avatarUrl} initials={`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`} />
        <div className="admin-user-identity"><strong>{user.firstName} {user.lastName}</strong><span>@{user.username}</span><code>{user.publicId}</code></div>
        <div className="admin-user-contact"><span>{user.email}</span><small>{user.role} · {user.locale.toUpperCase()}</small></div>
        <div className="admin-user-stats"><span><b>{user._count.dives}</b> {copy.dives}</span><span><b>{user._count.plannedDives}</b> {copy.plans}</span><span><b>{user._count.reviews}</b> {copy.reviews}</span><span><b>{friendshipLinks}</b> <UserRound size={12} /></span></div>
        <div className="admin-user-meta"><span>{copy.visibility}: {user.profileVisibility} / {user.logbookVisibility}</span><small>{copy.registered} {new Date(user.createdAt).toLocaleDateString(locale)}</small></div>
        <Link href={`/profile/${user.publicId}`}>{copy.profile}<ExternalLink size={14} /></Link>
      </article>;
    })}</section>
  </div>;
}
