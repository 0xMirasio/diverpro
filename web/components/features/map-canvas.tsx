"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";

export type MapPoint = {
  id: string;
  type: "dive" | "plan" | "review";
  source?: "self" | "friend" | "community";
  siteName: string;
  latitude: number;
  longitude: number;
  date: string;
  endDate?: string;
  rating?: number;
  owner?: { publicId: string | null; username: string | null };
};

type MapLabels = { completedDive: string; futureDive: string; siteReview: string };

export function MapCanvas({ points, locale, labels, className = "", fitPoints = false }: { points: MapPoint[]; locale: Locale; labels: MapLabels; className?: string; fitPoints?: boolean }) {
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

      map.on("load", () => {
        for (const point of points) {
          const markerElement = document.createElement("button");
          markerElement.type = "button";
          markerElement.className = `dive-map-marker ${point.type} ${point.source ?? "self"}`;
          markerElement.title = point.siteName;
          markerElement.setAttribute("aria-label", point.siteName);

          const popupContent = document.createElement("div");
          popupContent.className = "map-popup";
          const kind = document.createElement("span");
          kind.textContent = point.type === "dive" ? labels.completedDive : point.type === "plan" ? labels.futureDive : labels.siteReview;
          const title = document.createElement("strong");
          title.textContent = point.siteName;
          const meta = document.createElement("small");
          const start = new Date(point.date).toLocaleDateString(locale);
          const end = point.endDate ? new Date(point.endDate).toLocaleDateString(locale) : null;
          meta.textContent = `${end && end !== start ? `${start} – ${end}` : start}${point.rating ? ` · ${"★".repeat(point.rating)}` : ""}`;
          popupContent.append(kind, title, meta);
          if (point.owner?.publicId && point.owner.username) {
            const link = document.createElement("a");
            link.href = `/profile/${point.owner.publicId}`;
            link.textContent = `@${point.owner.username}`;
            popupContent.append(link);
          }
          new maplibre.Marker({ element: markerElement, anchor: "bottom" })
            .setLngLat([point.longitude, point.latitude])
            .setPopup(new maplibre.Popup({ offset: 18, closeButton: false }).setDOMContent(popupContent))
            .addTo(map!);
        }

        if (fitPoints && points.length > 1) {
          const bounds = new maplibre.LngLatBounds();
          for (const point of points) bounds.extend([point.longitude, point.latitude]);
          map?.fitBounds(bounds, { padding: 55, maxZoom: 7, duration: 0 });
        }
      });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [fitPoints, labels.completedDive, labels.futureDive, labels.siteReview, locale, points]);

  return <div className={`world-map ${className}`} ref={container} />;
}
