"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Check, Clock3, Search, UserPlus, UsersRound, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import { Avatar, FeatureHeader } from "@/components/features/shared";

type Diver = { publicId: string; username: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; relationship?: { id: string; status: string; incoming: boolean } | null; requestId?: string };

export function FriendsFeature() {
  const { locale } = useLanguage(); const c = featureCopy(locale); const [results, setResults] = useState<Diver[]>([]); const [friends, setFriends] = useState<Diver[]>([]); const [incoming, setIncoming] = useState<Diver[]>([]); const [outgoing, setOutgoing] = useState<Diver[]>([]); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/friends"); if (response.ok) { const data = await response.json(); setFriends(data.friends); setIncoming(data.incoming); setOutgoing(data.outgoing); } }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  async function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); const q = new FormData(event.currentTarget).get("q"); const response = await fetch(`/api/divers/search?q=${encodeURIComponent(String(q))}`); if (response.ok) setResults((await response.json()).divers); setLoading(false); }
  async function connect(identifier: string) { const response = await fetch("/api/friends/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) }); setMessage(response.ok ? c.requestSent : c.genericError); await load(); }
  async function answer(id: string, action: "accept" | "decline") { await fetch(`/api/friends/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); await load(); }
  const name = (d: Diver) => d.firstName ? `${d.firstName} ${d.lastName ?? ""}` : c.privateDiver;
  const initials = (d: Diver) => `${d.firstName?.[0] ?? d.username[0] ?? "D"}${d.lastName?.[0] ?? ""}`.toUpperCase();
  return <div className="feature-page"><FeatureHeader eyebrow="DIVE COMMUNITY" title={c.friendsTitle} subtitle={c.friendsSub} />
    <form className="diver-search" onSubmit={search}><Search size={20} /><input name="q" minLength={2} required placeholder={c.searchPlaceholder} /><button disabled={loading}>{loading ? c.loading : c.searchDivers}</button></form>{message && <p className="success-banner">{message}</p>}
    {results.length > 0 && <section className="people-grid search-results">{results.map((diver) => <article className="person-card" key={diver.publicId}><Avatar url={diver.avatarUrl} initials={initials(diver)} /><div><strong>{name(diver)}</strong><span>@{diver.username}</span><code>{diver.publicId}</code></div><div className="person-actions"><Link href={`/profile/${diver.publicId}`}>{c.viewProfile}</Link>{!diver.relationship && <button onClick={() => connect(diver.publicId)} type="button"><UserPlus size={15} />{c.connect}</button>}{diver.relationship?.status === "ACCEPTED" && <span><Check size={14} />{c.friends}</span>}{diver.relationship?.status === "PENDING" && <span><Clock3 size={14} />{diver.relationship.incoming ? c.pendingRequests : c.requestSent}</span>}</div></article>)}</section>}
    <div className="friends-columns"><section className="friends-section"><div className="section-heading"><h2>{c.pendingRequests}</h2><span>{incoming.length}</span></div>{incoming.length === 0 ? <p className="soft-empty">{c.noRequests}</p> : incoming.map((diver) => <article className="request-row" key={diver.requestId}><Avatar url={diver.avatarUrl} initials={initials(diver)} /><div><strong>{name(diver)}</strong><span>@{diver.username}</span></div><div><button className="accept" onClick={() => answer(diver.requestId!, "accept")}><Check size={15} />{c.accept}</button><button onClick={() => answer(diver.requestId!, "decline")}><X size={15} />{c.decline}</button></div></article>)}</section>
      <section className="friends-section"><div className="section-heading"><h2>{c.myFriends}</h2><span>{friends.length}</span></div>{friends.length === 0 ? <div className="soft-empty icon"><UsersRound size={25} /><p>{c.noFriends}</p></div> : <div className="people-grid">{friends.map((diver) => <article className="friend-tile" key={diver.publicId}><Avatar url={diver.avatarUrl} initials={initials(diver)} /><div><strong>{name(diver)}</strong><span>@{diver.username}</span></div><Link href={`/profile/${diver.publicId}`}>→</Link></article>)}</div>}</section>
    </div>{outgoing.length > 0 && <section className="friends-section outgoing"><div className="section-heading"><h2>{c.sentRequests}</h2><span>{outgoing.length}</span></div><div className="chip-list">{outgoing.map((diver) => <Link href={`/profile/${diver.publicId}`} key={diver.publicId}>@{diver.username}<Clock3 size={13} /></Link>)}</div></section>}</div>;
}
