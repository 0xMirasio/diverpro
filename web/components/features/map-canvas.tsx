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
  locationLabel?: string | null;
  maxDepthM?: number | null;
  environment?: string | null;
  topologies?: unknown;
};

type MapLabels = { completedDive: string; futureDive: string; siteReview: string; diveSite?: string; viewSite?: string };

export function MapCanvas({ points, locale, labels, className = "", fitPoints = false, catalogueLayer = false, visibleTypes, showFriendActivity = true }: { points: MapPoint[]; locale: Locale; labels: MapLabels; className?: string; fitPoints?: boolean; catalogueLayer?: boolean; visibleTypes?: MapPoint["type"][]; showFriendActivity?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("maplibre-gl").Map | null>(null);
  const markerElements = useRef<Array<{ element: HTMLElement; type: MapPoint["type"]; source?: MapPoint["source"] }>>([]);
  const visibility = useRef({ types: visibleTypes ?? ["dive", "plan", "review", "site"], showFriendActivity });

  useEffect(() => {
    const current = { types: visibleTypes ?? ["dive", "plan", "review", "site"], showFriendActivity };
    visibility.current = current;
    for (const marker of markerElements.current) marker.element.style.display = current.types.includes(marker.type) && (current.showFriendActivity || marker.source !== "friend") ? "" : "none";
    const map = mapInstance.current;
    if (map?.getLayer("bluemates-dive-sites")) map.setLayoutProperty("bluemates-dive-sites", "visibility", current.types.includes("site") ? "visible" : "none");
  }, [showFriendActivity, visibleTypes]);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;

    void import("maplibre-gl").then((module) => {
      if (disposed || !container.current) return;
      const maplibre = module.default;
      map = new maplibre.Map({
        container: container.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: fitPoints && points.length === 1 ? [points[0].longitude, points[0].latitude] : [3, 22],
        zoom: fitPoints && points.length === 1 ? 7 : 1.25,
      });
      mapInstance.current = map;
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibre.GlobeControl(), "top-right");

      function siteMarkerElement(point: MapPoint, linkToDetails = false) {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "selected-site-marker";
        marker.title = point.siteName;
        marker.setAttribute("aria-label", point.siteName);
        const pin = document.createElement("span");
        pin.className = "selected-site-pin";
        const dot = document.createElement("i");
        pin.append(dot); marker.append(pin);
        if (linkToDetails && point.href) marker.addEventListener("click", (event) => {
          event.preventDefault(); event.stopImmediatePropagation();
          window.location.assign(point.href!);
        });
        return marker;
      }

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
        if (point.locationLabel) { const location = document.createElement("b"); location.textContent = point.locationLabel; content.append(location); }
        const coordinates = document.createElement("code"); coordinates.textContent = `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`; content.append(coordinates);
        const topologies = Array.isArray(point.topologies) ? point.topologies.filter((value): value is string => typeof value === "string") : [];
        if (point.maxDepthM != null || point.environment || topologies.length) { const facts = document.createElement("small"); facts.textContent = [...topologies, point.environment, point.maxDepthM != null ? `${point.maxDepthM} m` : null].filter(Boolean).join(" · "); content.append(facts); }
        if (point.description) { const description = document.createElement("p"); description.textContent = point.description.slice(0, 180); content.append(description); }
        if (point.href) {
          const siteLink = document.createElement("a"); siteLink.href = point.href; siteLink.className = "map-popup-site-link";
          siteLink.textContent = labels.viewSite || point.siteName; siteLink.setAttribute("aria-label", `${labels.viewSite || "View site"}: ${point.siteName}`);
          siteLink.addEventListener("click", (event) => event.stopPropagation()); content.append(siteLink);
        }
        if (point.owner?.publicId && point.owner.username) {
          const link = document.createElement("a"); link.href = `/profile/${point.owner.publicId}`; link.textContent = `@${point.owner.username}`; content.append(link);
        }
        return content;
      }

      map.on("load", () => {
        map?.setProjection({ type: "globe" });
        const catalogue = catalogueLayer ? points.filter((point) => point.type === "site") : [];
        const regular = catalogueLayer ? points.filter((point) => point.type !== "site") : points;

        for (const point of regular) {
          const markerElement = point.type === "site" ? siteMarkerElement(point) : document.createElement("button");
          if (point.type !== "site") {
            markerElement.type = "button";
            markerElement.className = `dive-map-marker ${point.type} ${point.source ?? "self"}`;
            markerElement.title = point.siteName;
            markerElement.setAttribute("aria-label", point.siteName);
          }
          markerElement.style.display = visibility.current.types.includes(point.type) && (visibility.current.showFriendActivity || point.source !== "friend") ? "" : "none";
          markerElements.current.push({ element: markerElement, type: point.type, source: point.source });
          new maplibre.Marker({ element: markerElement, anchor: "bottom" })
            .setLngLat([point.longitude, point.latitude])
            .setPopup(new maplibre.Popup({ offset: point.type === "site" ? 36 : 18, closeButton: false }).setDOMContent(popupContent(point)))
            .addTo(map!);
        }

        if (catalogue.length) {
          const catalogueById = new Map(catalogue.map((point) => [point.id, point]));
          map?.addSource("bluemates-dive-sites", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: catalogue.map((point) => ({ type: "Feature", geometry: { type: "Point", coordinates: [point.longitude, point.latitude] }, properties: { id: point.id, isWreck: Array.isArray(point.topologies) && point.topologies.includes("wreck") } })),
            },
          });
          map?.addLayer({
            id: "bluemates-dive-sites",
            type: "circle",
            source: "bluemates-dive-sites",
            layout: { visibility: visibility.current.types.includes("site") ? "visible" : "none" },
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 2.5, 5, 4.5, 10, 7],
              "circle-color": ["case", ["==", ["get", "isWreck"], true], "#e87550", "#f1c443"],
              "circle-opacity": 0.26,
              "circle-stroke-color": ["case", ["==", ["get", "isWreck"], true], "#9f3d24", "#c69718"],
              "circle-stroke-opacity": 0.46,
              "circle-stroke-width": 1,
            },
          });
          let selectedSiteMarker: import("maplibre-gl").Marker | undefined;
          map?.on("click", "bluemates-dive-sites", (event) => {
            const id = String(event.features?.[0]?.properties?.id || "");
            const point = catalogueById.get(id);
            if (point) {
              selectedSiteMarker?.remove();
              const selectedElement = siteMarkerElement(point, true);
              selectedElement.style.display = visibility.current.types.includes("site") ? "" : "none";
              markerElements.current.push({ element: selectedElement, type: "site", source: point.source });
              selectedSiteMarker = new maplibre.Marker({ element: selectedElement, anchor: "bottom" })
                .setLngLat([point.longitude, point.latitude])
                .setPopup(new maplibre.Popup({ offset: 36, closeButton: true, closeOnClick: false }).setDOMContent(popupContent(point)))
                .addTo(map!);
              selectedSiteMarker.togglePopup();
            }
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

    return () => { disposed = true; markerElements.current = []; if (mapInstance.current === map) mapInstance.current = null; map?.remove(); };
  }, [catalogueLayer, fitPoints, labels.completedDive, labels.diveSite, labels.futureDive, labels.siteReview, labels.viewSite, locale, points]);

  return <div className={`world-map ${className}`} ref={container} />;
}
