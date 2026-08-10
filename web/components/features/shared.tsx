"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Camera, Check, LocateFixed, LockKeyhole, MapPin, Search, Upload, Users } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";

export function FeatureHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <header className="feature-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>;
}

export function VisibilitySelect({ name = "visibility", value, onChange }: { name?: string; value: "PUBLIC" | "PRIVATE"; onChange: (value: "PUBLIC" | "PRIVATE") => void }) {
  const { locale } = useLanguage(); const c = featureCopy(locale);
  return <div className="visibility-toggle" role="group">
    <button type="button" className={value === "PUBLIC" ? "active" : ""} onClick={() => onChange("PUBLIC")}><Users size={14} />{c.public}</button>
    <button type="button" className={value === "PRIVATE" ? "active" : ""} onClick={() => onChange("PRIVATE")}><LockKeyhole size={14} />{c.private}</button>
    <input type="hidden" name={name} value={value} />
  </div>;
}

export function LocationFields({ latitude, longitude, setLatitude, setLongitude }: { latitude: string; longitude: string; setLatitude: (v: string) => void; setLongitude: (v: string) => void }) {
  const { locale } = useLanguage(); const c = featureCopy(locale); const [error, setError] = useState(false);
  function locate() {
    if (!navigator.geolocation) return setError(true);
    navigator.geolocation.getCurrentPosition(
      (position) => { setLatitude(position.coords.latitude.toFixed(6)); setLongitude(position.coords.longitude.toFixed(6)); setError(false); },
      () => setError(true), { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return <div className="location-block"><div className="section-label"><span>{c.coordinates}</span><button type="button" onClick={locate}><LocateFixed size={14} />{c.useLocation}</button></div><div className="compact-row"><label>{c.latitude}<input type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="43.2965" /></label><label>{c.longitude}<input type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="5.3698" /></label></div>{error && <small className="inline-error">{c.locationDenied}</small>}</div>;
}

type Place = { id: string; name: string; label: string; context: string; type: string; latitude: number; longitude: number };

export function PlacePicker({ siteName, setSiteName, latitude, longitude, setLatitude, setLongitude }: { siteName: string; setSiteName: (value: string) => void; latitude: string; longitude: string; setLatitude: (value: string) => void; setLongitude: (value: string) => void }) {
  const { locale } = useLanguage(); const c = featureCopy(locale);
  const [query, setQuery] = useState(siteName); const [selectedQuery, setSelectedQuery] = useState(""); const [places, setPlaces] = useState<Place[]>([]); const [searching, setSearching] = useState(false); const [open, setOpen] = useState(false); const [searched, setSearched] = useState(false); const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || trimmed === selectedQuery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true); setSearched(false);
      const bias = latitude && longitude ? `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` : "";
      try {
        const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(trimmed)}&lang=${locale}${bias}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search");
        const data = await response.json(); setPlaces(data.places ?? []); setOpen(true); setSearched(true);
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) { setPlaces([]); setSearched(true); setOpen(true); } }
      finally { setSearching(false); }
    }, 380);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [latitude, locale, longitude, query, selectedQuery]);

  function choose(place: Place) {
    const label = place.label.slice(0, 160);
    setQuery(label); setSelectedQuery(label); setSiteName(label);
    setLatitude(place.latitude.toFixed(6)); setLongitude(place.longitude.toFixed(6)); setOpen(false); setLocationError(false);
  }

  function change(value: string) {
    setQuery(value); setSiteName(value); setSelectedQuery(""); setLatitude(""); setLongitude(""); setOpen(value.trim().length >= 3); setSearched(false);
  }

  function locate() {
    if (!navigator.geolocation) return setLocationError(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude.toFixed(6); const lon = position.coords.longitude.toFixed(6);
      setLatitude(lat); setLongitude(lon); setLocationError(false);
      try {
        const response = await fetch(`/api/geocoding/reverse?lat=${lat}&lon=${lon}&lang=${locale}`);
        const place = response.ok ? (await response.json()).place as Place | null : null;
        if (place) choose(place); else { setQuery(`${lat}, ${lon}`); setSelectedQuery(`${lat}, ${lon}`); setSiteName(`${lat}, ${lon}`); }
      } catch { setQuery(`${lat}, ${lon}`); setSelectedQuery(`${lat}, ${lon}`); setSiteName(`${lat}, ${lon}`); }
    }, () => setLocationError(true), { enableHighAccuracy: true, timeout: 10000 });
  }

  return <div className="place-picker"><div className="section-label"><span>{c.searchPlace}</span><button type="button" onClick={locate}><LocateFixed size={14} />{c.useLocation}</button></div><div className={`place-search-input ${latitude && longitude ? "selected" : ""}`}><Search size={17} /><input name="siteName" value={query} onChange={(event) => change(event.target.value)} onFocus={() => query.trim().length >= 3 && setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 160)} placeholder={c.searchPlaceHelp} required maxLength={160} role="combobox" aria-expanded={open} aria-controls="place-suggestions" autoComplete="off" />{latitude && longitude && <Check size={16} />}</div>{open && <div className="place-suggestions" id="place-suggestions" role="listbox">{searching ? <div className="place-search-state"><span className="search-spinner" />{c.searchingPlaces}</div> : places.length ? places.map((place) => <button type="button" role="option" aria-selected="false" key={place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(place)}><span><MapPin size={16} /></span><div><strong>{place.name}</strong><small>{place.context || place.label}</small></div><em>{place.type.replaceAll("_", " ")}</em></button>) : searched ? <div className="place-search-state">{c.noPlaceFound}</div> : null}</div>}{latitude && longitude && <div className="selected-place"><MapPin size={14} /><span><small>{c.selectedLocation}</small><strong>{siteName}</strong></span><code>{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</code></div>}<details className="manual-coordinates"><summary>{c.manualCoordinates}</summary><div className="compact-row"><label>{c.latitude}<input type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="43.2965" /></label><label>{c.longitude}<input type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="5.3698" /></label></div></details>{locationError && <small className="inline-error">{c.locationDenied}</small>}<small className="geocoding-credit">{c.geocodingCredit}</small></div>;
}

export function PhotoUploader({ kind, multiple = true, onChange }: { kind: "AVATAR" | "DIVE" | "REVIEW"; multiple?: boolean; onChange: (ids: string[]) => void }) {
  const { locale } = useLanguage(); const c = featureCopy(locale);
  const [items, setItems] = useState<{ id: string; url: string }[]>([]); const [pending, setPending] = useState(false); const [error, setError] = useState(false);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, multiple ? 6 - items.length : 1);
    if (!files.length) return; setPending(true); setError(false);
    if (kind === "AVATAR" && files.some((file) => file.size > 300 * 1024)) { setError(true); setPending(false); event.target.value = ""; return; }
    try {
      const uploaded = [];
      for (const file of files) {
        const form = new FormData(); form.set("file", file); form.set("kind", kind);
        const response = await fetch("/api/media", { method: "POST", body: form });
        if (!response.ok) throw new Error("upload");
        uploaded.push((await response.json()).media as { id: string; url: string });
      }
      const next = multiple ? [...items, ...uploaded] : uploaded; setItems(next); onChange(next.map((item) => item.id));
    } catch { setError(true); } finally { setPending(false); event.target.value = ""; }
  }
  return <div className="photo-uploader"><label className="upload-button"><input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={select} disabled={pending || (multiple && items.length >= 6)} /><Upload size={15} />{pending ? c.loading : kind === "AVATAR" ? c.profilePhoto : c.choosePhotos}</label><small>{kind === "AVATAR" ? c.avatarPhotoHelp : c.maxPhotos}</small>{error && <span className="inline-error">{c.uploadError}</span>}{items.length > 0 && <div className="photo-previews">{items.map((item) => <img src={item.url} alt="" key={item.id} />)}</div>}</div>;
}

export function Avatar({ url, initials, size = "normal" }: { url?: string | null; initials: string; size?: "normal" | "large" }) {
  return url ? <img className={`user-avatar ${size}`} src={url} alt="" /> : <span className={`user-avatar fallback ${size}`}><Camera size={size === "large" ? 25 : 15} /><b>{initials}</b></span>;
}
