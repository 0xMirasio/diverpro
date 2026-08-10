"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, MapPin, Star } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { featureCopy } from "@/lib/features-i18n";
import { MapCanvas, type MapPoint } from "@/components/features/map-canvas";
import { FeatureHeader } from "@/components/features/shared";

type PointType = MapPoint["type"];

export function WorldMapFeature({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [filters, setFilters] = useState<Record<PointType, boolean>>({ dive: true, plan: true, review: false, site: false });
  const [showFriendActivity, setShowFriendActivity] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/map", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { points: [] })
      .then((data) => setPoints(data.points ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const visiblePoints = useMemo(() => points.filter((point) => filters[point.type] && (showFriendActivity || point.source !== "friend")), [filters, points, showFriendActivity]);
  const labels = useMemo(() => ({ completedDive: c.completedDive, futureDive: c.futureDive, siteReview: c.siteReview, diveSite: c.diveSite, viewSite: c.viewSite }), [c.completedDive, c.diveSite, c.futureDive, c.siteReview, c.viewSite]);
  const dataCredit = locale === "fr" ? "Sites © contributeurs OpenStreetMap et OpenDiveMap · ODbL · Fond de carte © OpenFreeMap" : locale === "es" ? "Sitios © colaboradores de OpenStreetMap y OpenDiveMap · ODbL · Mapa base © OpenFreeMap" : "Dive sites © OpenStreetMap and OpenDiveMap contributors · ODbL · Basemap © OpenFreeMap";
  const countBadge = <div className="map-count"><Globe2 size={18} /><strong>{visiblePoints.length}</strong><span>PIN{visiblePoints.length === 1 ? "" : "S"}</span></div>;
  const choices: [PointType, string][] = [["dive", c.completedDive], ["plan", c.futureDive], ["site", c.showDiveSites]];

  function toggle(type: PointType) {
    setFilters((current) => ({ ...current, [type]: !current[type] }));
  }

  return <div className={`feature-page map-page ${embedded ? "embedded-map" : ""}`}>
    {embedded
      ? <header className="embedded-map-heading"><div><span>GLOBAL DIVE MAP</span><h2>{c.mapTitle}</h2><p>{c.mapSub}</p></div>{countBadge}</header>
      : <FeatureHeader eyebrow="GLOBAL DIVE MAP" title={c.mapTitle} subtitle={c.mapSub} action={countBadge} />}
    <div className="map-filters" role="group" aria-label={c.mapFilters}>
      {choices.map(([type, label]) => <button type="button" className={filters[type] ? "active" : ""} aria-pressed={filters[type]} onClick={() => toggle(type)} key={type}><i className={type} />{label}</button>)}
      <button type="button" className={`friend-filter ${showFriendActivity ? "active" : ""}`} aria-pressed={showFriendActivity} onClick={() => setShowFriendActivity((current) => !current)}><span className="friend-shapes"><i /><i /></span>{c.friendActivity}</button>
    </div>
    <div className="map-frame">
      {points.length === 0 && <div className="map-loading"><MapPin size={24} /><span>{c.loadingMap}</span></div>}
      <MapCanvas points={visiblePoints} locale={locale} labels={labels} catalogueLayer />
    </div>
    <p className="map-hint"><Star size={14} />{c.mapHint}</p>
    <p className="map-hint site-credit">{dataCredit}</p>
  </div>;
}
