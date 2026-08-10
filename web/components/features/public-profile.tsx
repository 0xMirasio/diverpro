"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, Gauge, Globe2, LockKeyhole, MapPin, Star, UserPlus } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { MapCanvas, type MapPoint } from "@/components/features/map-canvas";
import { featureCopy } from "@/lib/features-i18n";

type ProfileDive = { id: string; date: string; siteName: string; depthM: number; durationMinutes: number; groupCount: number; details: string | null; latitude: number | null; longitude: number | null; photos: { id: string }[] };
type ProfilePlan = { id: string; plannedFor: string; plannedUntil: string; siteName: string; details: string | null };
type ProfileReview = { id: string; siteName: string; rating: number; comment: string | null; photos: { id: string }[] };
type ProfileData = { publicId: string; username: string; firstName: string | null; lastName: string | null; bio: string | null; avatarUrl: string | null; age: number | null; createdAt: string; full: boolean; self: boolean; relationship: { status: string; incoming: boolean } | null; dives: ProfileDive[]; plans: ProfilePlan[]; reviews: ProfileReview[] };

export function PublicProfile({ profile }: { profile: ProfileData }) {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [relationship, setRelationship] = useState(profile.relationship);
  const [error, setError] = useState(false);
  const displayName = profile.full && profile.firstName ? `${profile.firstName} ${profile.lastName ?? ""}` : `@${profile.username}`;
  const initials = `${profile.firstName?.[0] ?? profile.username[0] ?? "D"}${profile.lastName?.[0] ?? ""}`.toUpperCase();
  const totalDives = profile.dives.reduce((total, dive) => total + dive.groupCount, 0);
  const labels = useMemo(() => ({ completedDive: c.completedDive, futureDive: c.futureDive, siteReview: c.siteReview }), [c.completedDive, c.futureDive, c.siteReview]);
  const mapPoints = useMemo<MapPoint[]>(() => profile.dives.flatMap((dive) => dive.latitude == null || dive.longitude == null ? [] : [{ id: dive.id, type: "dive" as const, siteName: dive.siteName, latitude: dive.latitude, longitude: dive.longitude, date: dive.date, owner: { publicId: profile.publicId, username: profile.username } }]), [profile.dives, profile.publicId, profile.username]);

  async function connect() {
    const response = await fetch("/api/friends/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: profile.publicId }) });
    if (response.ok) setRelationship({ status: "PENDING", incoming: false }); else setError(true);
  }

  function planRange(plan: ProfilePlan) {
    const start = new Date(plan.plannedFor).toLocaleDateString(locale);
    const end = new Date(plan.plannedUntil).toLocaleDateString(locale);
    return start === end ? start : `${start} – ${end}`;
  }

  return <div className="public-profile-page">
    <header className="public-profile-hero">
      <div className="public-avatar">{profile.avatarUrl && profile.full ? <img src={profile.avatarUrl} alt="" /> : <span>{initials}</span>}</div>
      <div className="public-profile-copy"><span>{c.publicProfile}</span><h1>{displayName}</h1><p>@{profile.username} · <code>{profile.publicId}</code></p>{profile.full && profile.bio && <blockquote>{profile.bio}</blockquote>}<small>{c.joined} {new Date(profile.createdAt).toLocaleDateString(locale, { month: "long", year: "numeric" })}{profile.full && profile.age ? ` · ${profile.age} ${c.age.toLowerCase()}` : ""}</small></div>
      <div className="connect-area">{profile.self ? <Link href="/settings/profile">{c.navProfile}</Link> : relationship?.status === "ACCEPTED" ? <span><Check size={16} />{c.alreadyConnected}</span> : relationship?.status === "PENDING" ? <span><Clock3 size={16} />{relationship.incoming ? c.incomingConnection : c.connectionPending}</span> : <button type="button" onClick={connect}><UserPlus size={17} />{c.connect}</button>}{error && <small>{c.genericError}</small>}</div>
    </header>
    {!profile.full ? <div className="private-profile-notice"><LockKeyhole size={33} /><h2>{c.hiddenProfile}</h2><p>{c.visibilityHelp}</p></div> : <>
      <section className="profile-map-section">
        <div className="profile-map-heading"><div><span><Globe2 size={17} />{c.profileDiveMap}</span><p>{c.profileDiveMapSub}</p></div><strong>{mapPoints.length}</strong></div>
        {mapPoints.length ? <MapCanvas points={mapPoints} locale={locale} labels={labels} className="profile-world-map" fitPoints /> : <p className="soft-empty">{c.noMappedDives}</p>}
      </section>
      <div className="public-profile-sections">
        <section><div className="section-heading"><h2>{c.dives}</h2><span>{totalDives}</span></div>{profile.dives.length === 0 ? <p className="soft-empty">{c.noDives}</p> : <div className="public-items">{profile.dives.map((dive) => <article key={dive.id}><div><MapPin size={16} /><strong>{dive.siteName}</strong><span>{new Date(dive.date).toLocaleDateString(locale)}{dive.groupCount > 1 ? ` · ×${dive.groupCount}` : ""}</span></div><p>{dive.details || "—"}</p><small><Gauge size={14} />{dive.depthM} {c.meters} · {dive.durationMinutes} {c.minutes}</small>{dive.photos.length > 0 && <div className="entry-photos">{dive.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt="" key={photo.id} />)}</div>}</article>)}</div>}</section>
        <section><div className="section-heading"><h2>{c.upcoming}</h2><span>{profile.plans.length}</span></div>{profile.plans.length === 0 ? <p className="soft-empty">{c.noPlans}</p> : <div className="public-items compact">{profile.plans.map((plan) => <article key={plan.id}><div><CalendarClock size={16} /><strong>{plan.siteName}</strong><span>{planRange(plan)}</span></div><p>{plan.details || "—"}</p></article>)}</div>}</section>
        <section><div className="section-heading"><h2>{c.reviews}</h2><span>{profile.reviews.length}</span></div>{profile.reviews.length === 0 ? <p className="soft-empty">{c.noReviews}</p> : <div className="public-items compact">{profile.reviews.map((review) => <article key={review.id}><div><Star size={16} /><strong>{review.siteName}</strong><span>{"★".repeat(review.rating)}</span></div><p>{review.comment || "—"}</p>{review.photos.length > 0 && <div className="entry-photos">{review.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt="" key={photo.id} />)}</div>}</article>)}</div>}</section>
      </div>
    </>}
  </div>;
}
