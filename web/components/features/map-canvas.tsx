"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";

export type MapPoint = {
  id: string;
  type: "dive" | "plan" | "review" | "site";
  source?: "self" | "friend" | "community";
  siteName: string;
  latitude: number;
  longitude: number;
  date?: string;
  endDate?: string;
  rating?: number;
  owner?: { publicId: string | null; username: string | null };
  description?: string | null;
  reviewCount?: number;
  href?: string;
};

type MapLabels = { completedDive: string; futureDive: string; siteReview: string; diveSite?: string };

export function MapCanvas({ points, locale, labels, className = "", fitPoints = false, catalogueLayer = false }: { points: MapPoint[]; locale: Locale; labels: MapLabels; className?: string; fitPoints?: boolean; catalogueLayer?: boolean }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;

    void import("maplibre-gl").then((module) => {
      if (disposed || !container.current) return;
      const maplibre = module.default;
      map = new maplibre.Map({
        container: container.current,
        style: "https://demotiles.maplibre.org/globe.json",
        center: fitPoints && points.length === 1 ? [points[0].longitude, points[0].latitude] : [3, 22],
        zoom: fitPoints && points.length === 1 ? 7 : 1.25,
      });
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibre.GlobeControl(), "top-right");

      function popupContent(point: MapPoint) {
        const content = document.createElement("div");
        content.className = "map-popup";
        const kind = document.createElement("span");
        kind.textContent = point.type === "dive" ? labels.completedDive : point.type === "plan" ? labels.futureDive : point.type === "review" ? labels.siteReview : labels.diveSite || "Dive site";
        const title = document.createElement("strong");
        title.textContent = point.siteName;
        const meta = document.createElement("small");
        const start = point.date ? new Date(point.date).toLocaleDateString(locale) : "";
        const end = point.endDate ? new Date(point.endDate).toLocaleDateString(locale) : null;
        meta.textContent = `${end && end !== start ? `${start} – ${end}` : start}${point.rating ? ` · ${"★".repeat(point.rating)}` : ""}${point.reviewCount != null ? `${start ? " · " : ""}${point.reviewCount} review${point.reviewCount === 1 ? "" : "s"}` : ""}`;
        content.append(kind, title, meta);
        if (point.description) { const description = document.createElement("p"); description.textContent = point.description.slice(0, 180); content.append(description); }
        if (point.href) { const siteLink = document.createElement("a"); siteLink.href = point.href; siteLink.textContent = point.siteName; content.append(siteLink); }
        if (point.owner?.publicId && point.owner.username) {
          const link = document.createElement("a"); link.href = `/profile/${point.owner.publicId}`; link.textContent = `@${point.owner.username}`; content.append(link);
        }
        return content;
      }

      map.on("load", () => {
        const catalogue = catalogueLayer ? points.filter((point) => point.type === "site") : [];
        const regular = catalogueLayer ? points.filter((point) => point.type !== "site") : points;

        for (const point of regular) {
          const markerElement = document.createElement("button");
          markerElement.type = "button";
          markerElement.className = `dive-map-marker ${point.type} ${point.source ?? "self"}`;
          markerElement.title = point.siteName;
          markerElement.setAttribute("aria-label", point.siteName);
          new maplibre.Marker({ element: markerElement, anchor: "bottom" })
            .setLngLat([point.longitude, point.latitude])
            .setPopup(new maplibre.Popup({ offset: 18, closeButton: false }).setDOMContent(popupContent(point)))
            .addTo(map!);
        }

        if (catalogue.length) {
          const catalogueById = new Map(catalogue.map((point) => [point.id, point]));
          map?.addSource("bluemates-dive-sites", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: catalogue.map((point) => ({ type: "Feature", geometry: { type: "Point", coordinates: [point.longitude, point.latitude] }, properties: { id: point.id } })),
            },
          });
          map?.addLayer({
            id: "bluemates-dive-sites",
            type: "circle",
            source: "bluemates-dive-sites",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 2.5, 5, 4.5, 10, 7],
              "circle-color": "#f1c443",
              "circle-opacity": 0.26,
              "circle-stroke-color": "#c69718",
              "circle-stroke-opacity": 0.46,
              "circle-stroke-width": 1,
            },
          });
          map?.on("click", "bluemates-dive-sites", (event) => {
            const id = String(event.features?.[0]?.properties?.id || "");
            const point = catalogueById.get(id);
            if (point) new maplibre.Popup({ offset: 8, closeButton: false }).setLngLat(event.lngLat).setDOMContent(popupContent(point)).addTo(map!);
          });
          map?.on("mouseenter", "bluemates-dive-sites", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
          map?.on("mouseleave", "bluemates-dive-sites", () => { if (map) map.getCanvas().style.cursor = ""; });
        }

        if (fitPoints && points.length > 1) {
          const bounds = new maplibre.LngLatBounds();
          for (const point of points) bounds.extend([point.longitude, point.latitude]);
          map?.fitBounds(bounds, { padding: 55, maxZoom: 7, duration: 0 });
        }
      });
    });

    return () => { disposed = true; map?.remove(); };
  }, [catalogueLayer, fitPoints, labels.completedDive, labels.diveSite, labels.futureDive, labels.siteReview, locale, points]);

  return <div className={`world-map ${className}`} ref={container} />;
}
