"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { MapCanvas, type MapPoint } from "@/components/features/map-canvas";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";

type Site = { id: string; name: string; latitude: number; longitude: number; description?: string | null; source: "OSM" | "OPEN_DIVEMAP" | "COMMUNITY"; sourceUrl?: string | null; countryName?: string | null; seaName?: string | null; environment?: string | null; topologies?: string[] | null; maxDepthM?: number | null; entryType?: string | null; metadata?: { openDiveMap?: unknown } | null; reviews: Array<{ id: string; rating: number; comment?: string | null; createdAt: string; photos: { id: string }[]; user: { publicId: string | null; username: string | null } }> };

export function SiteDetailFeature({ siteId }: { siteId: string }) {
  const { locale } = useLanguage(); const c = featureCopy(locale); const [site, setSite] = useState<Site | null>(null); const [editing, setEditing] = useState(false); const [pending, setPending] = useState(false);
  async function load() { const response = await fetch(`/api/sites/${siteId}`); if (response.ok) setSite((await response.json()).site); }
  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(async () => { const response = await fetch(`/api/sites/${siteId}`, { signal: controller.signal }); if (response.ok) setSite((await response.json()).site); }, 0); return () => { controller.abort(); window.clearTimeout(timer); }; }, [siteId]);
  const labels = useMemo(() => ({ completedDive: c.completedDive, futureDive: c.futureDive, siteReview: c.siteReview, diveSite: c.diveSite }), [c.completedDive, c.diveSite, c.futureDive, c.siteReview]);
  const dataCredit = locale === "fr" ? "Sites © contributeurs OpenStreetMap et OpenDiveMap · ODbL · Fond de carte © OpenFreeMap" : locale === "es" ? "Sitios © colaboradores de OpenStreetMap y OpenDiveMap · ODbL · Mapa base © OpenFreeMap" : "Dive sites © OpenStreetMap and OpenDiveMap contributors · ODbL · Basemap © OpenFreeMap";
  if (!site) return <div className="map-loading standalone"><MapPin size={24} />{c.loading}</div>;
  const locationLabel = [site.seaName, site.countryName].filter(Boolean).join(" · ") || null;
  const point: MapPoint[] = [{ id: site.id, type: "site", siteName: site.name, latitude: site.latitude, longitude: site.longitude, description: site.description, reviewCount: site.reviews.length, locationLabel, environment: site.environment, maxDepthM: site.maxDepthM }];
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); const form = new FormData(event.currentTarget); const response = await fetch(`/api/sites/${siteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: form.get("description") }) }); if (response.ok) { await load(); setEditing(false); } setPending(false); }
  const average = site.reviews.length ? site.reviews.reduce((sum, review) => sum + review.rating, 0) / site.reviews.length : null;
  const sourceName = site.source === "OPEN_DIVEMAP" ? "OpenDiveMap" : site.source === "OSM" ? "OpenStreetMap" : "BlueMates";
  return <div className="feature-page site-detail-page"><header className="site-detail-hero"><div><span>{c.diveSite} · {sourceName}</span><h1>{site.name}</h1>{locationLabel && <p><MapPin size={15} />{locationLabel}</p>}<p><MapPin size={15} />{site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}</p><div className="site-facts">{site.environment && <b>{site.environment}</b>}{site.entryType && <b>{site.entryType}</b>}{site.maxDepthM != null && <b>{site.maxDepthM} m</b>}{site.topologies?.map((topology) => <b key={topology}>{topology.replaceAll("_", " ")}</b>)}</div>{average != null && <strong>★ {average.toFixed(1)} · {site.reviews.length} {c.reviewCount.toLowerCase()}</strong>}</div>{site.sourceUrl && <a href={site.sourceUrl} target="_blank" rel="noreferrer">{sourceName} <ExternalLink size={14} /></a>}</header>
    <MapCanvas points={point} locale={locale} labels={labels} className="site-detail-map" fitPoints />
    <section className="site-description-panel"><div className="section-heading"><h2>{c.siteDescription}</h2><button type="button" onClick={() => setEditing((value) => !value)}>{c.editDescription}</button></div>{editing ? <form onSubmit={save}><textarea name="description" defaultValue={site.description || ""} rows={8} maxLength={6000} /><button className="primary-action" disabled={pending}>{c.saveDescription}</button></form> : <p>{site.description || c.noSiteDescription}</p>}</section>
    <section className="site-community-reviews"><div className="section-heading"><h2>{c.communityReviews}</h2><span>{site.reviews.length}</span></div><div className="people-grid">{site.reviews.map((review) => <article className="review-card" key={review.id}><div><strong>{review.user.username ? <Link href={`/profile/${review.user.publicId}`}>@{review.user.username}</Link> : c.privateDiver}</strong><span className="mini-stars">{Array.from({ length: 5 }, (_, index) => <Star size={13} fill={index < review.rating ? "currentColor" : "none"} key={index} />)}</span></div><p>{review.comment || "—"}</p>{review.photos.length > 0 && <div className="entry-photos">{review.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt={site.name} key={photo.id} />)}</div>}</article>)}</div></section>
    <small className="site-data-credit">{dataCredit}</small>
  </div>;
}
