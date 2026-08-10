"use client";

import { FormEvent, KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Copy, Gauge, MapPin, Timer, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import { FeatureHeader, PhotoUploader, PlacePicker, VisibilitySelect } from "@/components/features/shared";

type Dive = { id: string; date: string; siteName: string; depthM: number; durationMinutes: number; groupCount: number; details?: string | null; latitude?: number | null; longitude?: number | null; visibility: "PUBLIC" | "PRIVATE"; photos: { id: string }[] };

export function LogbookFeature() {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [dives, setDives] = useState<Dive[]>([]);
  const [bookVisibility, setBookVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [diveVisibility, setDiveVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [siteName, setSiteName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupAmount, setGroupAmount] = useState(2);
  const [pending, setPending] = useState(false);
  const [entryPending, setEntryPending] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const totalDives = useMemo(() => dives.reduce((total, dive) => total + dive.groupCount, 0), [dives]);

  async function load() {
    const response = await fetch("/api/dives");
    if (response.ok) {
      const data = await response.json();
      setDives(data.dives);
      setBookVisibility(data.logbookVisibility);
    }
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);

  async function setPrivacy(value: "PUBLIC" | "PRIVATE") {
    setBookVisibility(value);
    await fetch("/api/dives", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logbookVisibility: value }) });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true); setError(false);
    const form = new FormData(formElement);
    const response = await fetch("/api/dives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: form.get("date"), siteName, depthM: Number(form.get("depthM")), durationMinutes: Number(form.get("durationMinutes")), details: form.get("details"), visibility: diveVisibility, latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null, photoIds }) });
    if (response.ok) {
      formElement.reset(); setSiteName(""); setLatitude(""); setLongitude(""); setPhotoIds([]);
      setUploadVersion((value) => value + 1); await load();
    } else setError(true);
    setPending(false);
  }

  async function toggleDive(dive: Dive) {
    const visibility = dive.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    const response = await fetch(`/api/dives/${dive.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility }) });
    if (response.ok) await load();
  }

  function selectDive(dive: Dive) {
    setSelectedId((current) => current === dive.id ? null : dive.id);
    setGroupAmount(dive.groupCount > 1 ? dive.groupCount : 2);
  }

  function selectWithContext(event: MouseEvent, dive: Dive) {
    event.preventDefault();
    setSelectedId(dive.id);
    setGroupAmount(dive.groupCount > 1 ? dive.groupCount : 2);
  }

  function selectWithKeyboard(event: KeyboardEvent, dive: Dive) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectDive(dive); }
  }

  async function groupDive(dive: Dive) {
    const amount = Math.max(1, Math.min(100, Math.round(groupAmount)));
    setEntryPending(dive.id);
    const response = await fetch(`/api/dives/${dive.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupCount: amount }) });
    if (response.ok) { setSelectedId(null); await load(); }
    else setError(true);
    setEntryPending(null);
  }

  async function deleteDive(dive: Dive) {
    if (!window.confirm(c.deleteDiveConfirm)) return;
    setEntryPending(dive.id);
    const response = await fetch(`/api/dives/${dive.id}`, { method: "DELETE" });
    if (response.ok) { setSelectedId(null); await load(); }
    else setError(true);
    setEntryPending(null);
  }

  let consumed = 0;
  const numberedDives = dives.map((dive) => {
    const end = totalDives - consumed;
    const start = end - dive.groupCount + 1;
    consumed += dive.groupCount;
    const number = dive.groupCount > 1
      ? `#${String(start).padStart(3, "0")}–#${String(end).padStart(3, "0")}`
      : `#${String(end).padStart(3, "0")}`;
    return { dive, number };
  });

  return <div className="feature-page logbook-page">
    <FeatureHeader eyebrow="DIVE LOG" title={c.logbookTitle} subtitle={c.logbookSub} action={<div className="privacy-action"><small>{c.logbookPrivacy}</small><VisibilitySelect value={bookVisibility} onChange={setPrivacy} /></div>} />
    <div className="logbook-surface">
      <form className="feature-form logbook-form" onSubmit={submit}>
        <div className="form-title"><span>01</span><div><h2>{c.addDive}</h2><p>{c.visibilityHelp}</p></div></div>
        <PlacePicker {...{ siteName, setSiteName, latitude, longitude, setLatitude, setLongitude }} />
        <div className="form-grid"><label>{c.date}<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>{c.depth}<input name="depthM" type="number" step="0.1" min="0.1" max="350" required /></label><label>{c.duration}<input name="durationMinutes" type="number" min="1" max="1440" required /></label></div>
        <label>{c.details}<textarea name="details" rows={4} maxLength={4000} /></label>
        <div className="form-split"><div><span className="section-label">{c.divePrivacy}</span><VisibilitySelect value={diveVisibility} onChange={setDiveVisibility} /></div><div><span className="section-label">{c.photos}</span><PhotoUploader key={uploadVersion} kind="DIVE" onChange={setPhotoIds} /></div></div>
        {error && <p className="form-error">{c.genericError}</p>}
        <button className="primary-action" disabled={pending || !siteName}>{pending ? c.saving : c.saveDive}</button>
      </form>
      <section className="logbook-entries">
        <div className="entries-heading"><div><h2>{c.navLogbook}</h2><small>{c.clickDiveActions}</small></div><span>{totalDives}</span></div>
        {dives.length === 0 ? <div className="empty-feature"><Gauge size={30} /><p>{c.noDives}</p></div> : numberedDives.map(({ dive, number }) => <article className={`dive-entry ${selectedId === dive.id ? "selected" : ""}`} key={dive.id} role="button" onClick={() => selectDive(dive)} onContextMenu={(event) => selectWithContext(event, dive)} onKeyDown={(event) => selectWithKeyboard(event, dive)} tabIndex={0} aria-expanded={selectedId === dive.id}>
          <span className="dive-number">{number}{dive.groupCount > 1 && <b>×{dive.groupCount}</b>}</span>
          <div className="dive-entry-main">
            <div><MapPin size={16} /><h3>{dive.siteName}</h3><button type="button" onClick={(event) => { event.stopPropagation(); void toggleDive(dive); }} className={`privacy-dot ${dive.visibility.toLowerCase()}`}>{dive.visibility === "PUBLIC" ? c.public : c.private}</button></div>
            <p>{dive.details || "—"}</p>
            <div className="dive-metrics"><span><CalendarDays size={14} />{new Date(dive.date).toLocaleDateString(locale)}</span><span><Gauge size={14} />{dive.depthM} {c.meters}</span><span><Timer size={14} />{dive.durationMinutes} {c.minutes}</span></div>
            {dive.photos.length > 0 && <div className="entry-photos">{dive.photos.map((photo) => <img src={`/api/media/${photo.id}`} alt="" key={photo.id} />)}</div>}
            {selectedId === dive.id && <div className="dive-entry-actions" onClick={(event) => event.stopPropagation()}>
              <div><Copy size={16} /><label>{c.groupSize}<input type="number" min="1" max="100" value={groupAmount} onChange={(event) => setGroupAmount(Number(event.target.value))} /></label><button type="button" disabled={entryPending === dive.id} onClick={() => groupDive(dive)}>{c.groupDive}</button></div>
              <button className="danger-action" type="button" disabled={entryPending === dive.id} onClick={() => deleteDive(dive)}><Trash2 size={15} />{c.deleteDive}</button>
            </div>}
          </div>
        </article>)}
      </section>
    </div>
  </div>;
}
