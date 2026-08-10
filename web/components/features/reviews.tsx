"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { MapPin, MessageSquareMore, Star, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { MapCanvas, type MapPoint } from "@/components/features/map-canvas";
import { featureCopy } from "@/lib/features-i18n";
import { FeatureHeader, PhotoUploader, PlacePicker } from "@/components/features/shared";

type Review = { id: string; siteName: string; rating: number; comment?: string | null; latitude: number; longitude: number; createdAt: string; photos: { id: string }[] };

export function ReviewsFeature() {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const labels = useMemo(() => ({ completedDive: c.completedDive, futureDive: c.futureDive, siteReview: c.siteReview }), [c.completedDive, c.futureDive, c.siteReview]);

  async function load() {
    const response = await fetch("/api/reviews");
    if (response.ok) setReviews((await response.json()).reviews);
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (!selectedReview) return;
    const close = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setSelectedReview(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedReview]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true); setError(false);
    const form = new FormData(formElement);
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteName, latitude: Number(latitude), longitude: Number(longitude), rating, comment: form.get("comment"), photoIds }) });
    if (response.ok) {
      formElement.reset(); setSiteName(""); setLatitude(""); setLongitude(""); setPhotoIds([]); setUploadVersion((value) => value + 1); setRating(5); await load();
    } else setError(true);
    setPending(false);
  }

  function openWithKeyboard(event: KeyboardEvent, review: Review) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedReview(review); }
  }

  const selectedPoint: MapPoint[] = selectedReview ? [{ id: selectedReview.id, type: "review", siteName: selectedReview.siteName, latitude: selectedReview.latitude, longitude: selectedReview.longitude, date: selectedReview.createdAt, rating: selectedReview.rating }] : [];

  return <div className="feature-page">
    <FeatureHeader eyebrow="DIVE SITE INTELLIGENCE" title={c.reviewsTitle} subtitle={c.reviewsSub} />
    <div className="two-column-feature reviews-layout">
      <form className="feature-form" onSubmit={submit}>
        <div className="form-title"><span><Star size={19} /></span><div><h2>{c.siteReview}</h2><p>{c.clickMapInfo}</p></div></div>
        <PlacePicker {...{ siteName, setSiteName, latitude, longitude, setLatitude, setLongitude }} />
        <div><span className="section-label">{c.rating}</span><div className="star-picker">{[1,2,3,4,5].map((value) => <button type="button" className={value <= rating ? "active" : ""} onClick={() => setRating(value)} key={value}><Star size={23} fill="currentColor" /></button>)}</div></div>
        <label>{c.comment}<textarea name="comment" rows={5} maxLength={4000} /></label>
        <div><span className="section-label">{c.photos}</span><PhotoUploader key={uploadVersion} kind="REVIEW" onChange={setPhotoIds} /></div>
        {error && <p className="form-error">{c.required}</p>}
        <button className="primary-action" disabled={pending || !siteName || !latitude || !longitude}>{pending ? c.saving : c.publishReview}</button>
      </form>
      <section className="reviews-list">
        <div className="section-heading"><div><h2>{c.reviews}</h2><small>{c.clickReviewDetails}</small></div><span>{reviews.length}</span></div>
        {reviews.length === 0 ? <div className="empty-feature"><MessageSquareMore size={30} /><p>{c.noReviews}</p></div> : reviews.map((review) => <article className="review-card" key={review.id} role="button" tabIndex={0} onClick={() => setSelectedReview(review)} onKeyDown={(event) => openWithKeyboard(event, review)}>
          <div><h3><MapPin size={16} />{review.siteName}</h3><div className="mini-stars">{Array.from({ length: 5 }, (_, index) => <Star size={13} fill={index < review.rating ? "currentColor" : "none"} key={index} />)}</div></div>
          <p>{review.comment || "—"}</p><code>{review.latitude.toFixed(4)}, {review.longitude.toFixed(4)}</code>
          {review.photos.length > 0 && <div className="entry-photos">{review.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt="" key={photo.id} />)}</div>}
        </article>)}
      </section>
    </div>
    {selectedReview && <div className="review-modal-backdrop" role="presentation" onMouseDown={() => setSelectedReview(null)}>
      <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="review-modal-close" type="button" onClick={() => setSelectedReview(null)} aria-label={c.close}><X size={19} /></button>
        <div className="review-modal-copy"><span>{c.reviewDetails}</span><h2 id="review-detail-title">{selectedReview.siteName}</h2><div className="mini-stars">{Array.from({ length: 5 }, (_, index) => <Star size={16} fill={index < selectedReview.rating ? "currentColor" : "none"} key={index} />)}</div><p>{selectedReview.comment || "—"}</p><code>{selectedReview.latitude.toFixed(5)}, {selectedReview.longitude.toFixed(5)}</code></div>
        <MapCanvas points={selectedPoint} locale={locale} labels={labels} className="review-detail-map" fitPoints />
        {selectedReview.photos.length > 0 && <div className="review-detail-photos">{selectedReview.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt={selectedReview.siteName} key={photo.id} />)}</div>}
      </section>
    </div>}
  </div>;
}
