"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, MapPin, MessageSquareMore, Star, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { MapCanvas, type MapPoint } from "@/components/features/map-canvas";
import { featureCopy } from "@/lib/features-i18n";
import { FeatureHeader, PhotoUploader, PlacePicker } from "@/components/features/shared";

type Review = { id: string; siteName: string; rating: number; comment?: string | null; latitude: number; longitude: number; createdAt: string; photos: { id: string }[]; site?: { id: string; name: string } | null };
type Candidate = { id: string; name: string; latitude: number; longitude: number; description?: string | null; distanceMeters: number | null; nameSimilarity: number; reviewCount: number };
type Draft = { siteId?: string; siteName?: string; latitude?: number; longitude?: number; rating: number; comment: FormDataEntryValue | null; photoIds: string[]; confirmNewSite?: boolean };

export function ReviewsFeature() {
  const { locale } = useLanguage(); const c = featureCopy(locale);
  const [reviews, setReviews] = useState<Review[]>([]); const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5); const [siteName, setSiteName] = useState(""); const [placeName, setPlaceName] = useState("");
  const [latitude, setLatitude] = useState(""); const [longitude, setLongitude] = useState(""); const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]); const [draft, setDraft] = useState<Draft | null>(null); const [duplicatePrompt, setDuplicatePrompt] = useState(false);
  const [photoIds, setPhotoIds] = useState<string[]>([]); const [uploadVersion, setUploadVersion] = useState(0); const [pending, setPending] = useState(false); const [error, setError] = useState(false);
  const labels = useMemo(() => ({ completedDive: c.completedDive, futureDive: c.futureDive, siteReview: c.siteReview, diveSite: c.diveSite }), [c.completedDive, c.diveSite, c.futureDive, c.siteReview]);

  async function load() { const response = await fetch("/api/reviews"); if (response.ok) setReviews((await response.json()).reviews); }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (siteName.trim().length < 2 || selectedSiteId) return;
    const controller = new AbortController(); const timer = window.setTimeout(async () => {
      const coordinates = latitude !== "" && longitude !== "" ? `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` : "";
      const response = await fetch(`/api/sites/candidates?name=${encodeURIComponent(siteName)}${coordinates}`, { signal: controller.signal }).catch(() => null);
      if (response?.ok) setCandidates((await response.json()).sites ?? []);
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [latitude, longitude, selectedSiteId, siteName]);
  useEffect(() => { if (!selectedReview) return; const close = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setSelectedReview(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [selectedReview]);

  function useSite(site: Candidate) { setSelectedSiteId(site.id); setSiteName(site.name); setPlaceName(site.name); setLatitude(String(site.latitude)); setLongitude(String(site.longitude)); setCandidates([]); setDuplicatePrompt(false); }
  function changeSiteName(value: string) { setSiteName(value); setSelectedSiteId(null); setCandidates([]); setDraft(null); setDuplicatePrompt(false); }
  function reset() { setSiteName(""); setPlaceName(""); setLatitude(""); setLongitude(""); setSelectedSiteId(null); setCandidates([]); setDraft(null); setDuplicatePrompt(false); setPhotoIds([]); setUploadVersion((value) => value + 1); setRating(5); }
  async function publish(body: Draft) {
    setPending(true); setError(false);
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (response.status === 409 && result.error === "POSSIBLE_DUPLICATE") { setCandidates(result.sites ?? []); setDraft(body); setDuplicatePrompt(true); }
    else if (response.ok) { reset(); await load(); }
    else setError(true);
    setPending(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const body: Draft = selectedSiteId ? { siteId: selectedSiteId, rating, comment: form.get("comment"), photoIds } : { siteName, latitude: Number(latitude), longitude: Number(longitude), rating, comment: form.get("comment"), photoIds };
    setDraft(body); await publish(body);
  }
  function openWithKeyboard(event: KeyboardEvent, review: Review) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedReview(review); } }
  const selectedPoint: MapPoint[] = selectedReview ? [{ id: selectedReview.id, type: "review", siteName: selectedReview.siteName, latitude: selectedReview.latitude, longitude: selectedReview.longitude, date: selectedReview.createdAt, rating: selectedReview.rating }] : [];

  return <div className="feature-page"><FeatureHeader eyebrow="DIVE SITE INTELLIGENCE" title={c.reviewsTitle} subtitle={c.reviewsSub} /><div className="two-column-feature reviews-layout">
    <form className="feature-form" onSubmit={submit}><div className="form-title"><span><Star size={19} /></span><div><h2>{c.siteReview}</h2><p>{c.clickMapInfo}</p></div></div>
      <label>{c.siteNameLabel}<input value={siteName} onChange={(event) => changeSiteName(event.target.value)} required minLength={2} maxLength={160} /></label>
      <PlacePicker siteName={placeName} setSiteName={(value) => { setPlaceName(value); setSelectedSiteId(null); }} latitude={latitude} longitude={longitude} setLatitude={(value) => { setLatitude(value); setSelectedSiteId(null); }} setLongitude={(value) => { setLongitude(value); setSelectedSiteId(null); }} />
      {selectedSiteId && <p className="selected-catalog-site">✓ {c.useExistingSite}: <strong>{siteName}</strong></p>}
      {candidates.length > 0 && <CandidateList sites={candidates} title={duplicatePrompt ? c.possibleDuplicate : c.nearbySites} onChoose={useSite} />}
      {duplicatePrompt && draft && <button className="secondary-action warning" type="button" disabled={pending} onClick={() => publish({ ...draft, siteId: undefined, confirmNewSite: true })}><AlertTriangle size={15} />{c.createNewAnyway}</button>}
      <div><span className="section-label">{c.rating}</span><div className="star-picker">{[1,2,3,4,5].map((value) => <button type="button" className={value <= rating ? "active" : ""} onClick={() => setRating(value)} key={value}><Star size={23} fill="currentColor" /></button>)}</div></div>
      <label>{c.comment}<textarea name="comment" rows={5} maxLength={4000} /></label><div><span className="section-label">{c.photos}</span><PhotoUploader key={uploadVersion} kind="REVIEW" onChange={setPhotoIds} /></div>
      {error && <p className="form-error">{c.required}</p>}<button className="primary-action" disabled={pending || !siteName || (!selectedSiteId && (latitude === "" || longitude === ""))}>{pending ? c.saving : c.publishReview}</button>
    </form>
    <section className="reviews-list"><div className="section-heading"><div><h2>{c.reviews}</h2><small>{c.clickReviewDetails}</small></div><span>{reviews.length}</span></div>{reviews.length === 0 ? <div className="empty-feature"><MessageSquareMore size={30} /><p>{c.noReviews}</p></div> : reviews.map((review) => <article className="review-card" key={review.id} role="button" tabIndex={0} onClick={() => setSelectedReview(review)} onKeyDown={(event) => openWithKeyboard(event, review)}><div><h3><MapPin size={16} />{review.siteName}</h3><div className="mini-stars">{Array.from({ length: 5 }, (_, index) => <Star size={13} fill={index < review.rating ? "currentColor" : "none"} key={index} />)}</div></div><p>{review.comment || "—"}</p><code>{review.latitude.toFixed(4)}, {review.longitude.toFixed(4)}</code>{review.site && <Link href={`/sites/${review.site.id}`} onClick={(event) => event.stopPropagation()}>{c.viewSite}</Link>}{review.photos.length > 0 && <div className="entry-photos">{review.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt="" key={photo.id} />)}</div>}</article>)}</section>
  </div>{selectedReview && <div className="review-modal-backdrop" role="presentation" onMouseDown={() => setSelectedReview(null)}><section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-detail-title" onMouseDown={(event) => event.stopPropagation()}><button className="review-modal-close" type="button" onClick={() => setSelectedReview(null)} aria-label={c.close}><X size={19} /></button><div className="review-modal-copy"><span>{c.reviewDetails}</span><h2 id="review-detail-title">{selectedReview.siteName}</h2><div className="mini-stars">{Array.from({ length: 5 }, (_, index) => <Star size={16} fill={index < selectedReview.rating ? "currentColor" : "none"} key={index} />)}</div><p>{selectedReview.comment || "—"}</p>{selectedReview.site && <Link href={`/sites/${selectedReview.site.id}`}>{c.viewSite}</Link>}<code>{selectedReview.latitude.toFixed(5)}, {selectedReview.longitude.toFixed(5)}</code></div><MapCanvas points={selectedPoint} locale={locale} labels={labels} className="review-detail-map" fitPoints />{selectedReview.photos.length > 0 && <div className="review-detail-photos">{selectedReview.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt={selectedReview.siteName} key={photo.id} />)}</div>}</section></div>}</div>;
}

function CandidateList({ sites, title, onChoose }: { sites: Candidate[]; title: string; onChoose: (site: Candidate) => void }) {
  const { locale } = useLanguage(); const c = featureCopy(locale);
  return <section className="site-candidates"><strong><AlertTriangle size={15} />{title}</strong>{sites.map((site) => <article key={site.id}><div><b>{site.name}</b><small>{site.distanceMeters != null ? `${site.distanceMeters} m ${c.distanceAway}` : c.matchingName} · {site.reviewCount} ${c.reviewCount.toLowerCase()}</small></div><button type="button" onClick={() => onChoose(site)}>{c.useExistingSite}</button></article>)}</section>;
}
