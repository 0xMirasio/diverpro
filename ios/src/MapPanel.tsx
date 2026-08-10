import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { api } from "./api";
import { useLanguage } from "./i18n";
import { colors } from "./theme";
import type { MapPoint } from "./types";

let siteCache: MapPoint[] | null = null;
let sitePromise: Promise<MapPoint[]> | null = null;
async function loadSites() {
  if (siteCache) return siteCache;
  if (!sitePromise) sitePromise = api<{ points: MapPoint[] }>("/api/sites/map").then((result) => (siteCache = result.points)).finally(() => { sitePromise = null; });
  return sitePromise;
}

const initialRegion: Region = { latitude: 25, longitude: 5, latitudeDelta: 115, longitudeDelta: 180 };

export function MapPanel({ height = 360, allowCatalogue = true, onSite }: { height?: number; allowCatalogue?: boolean; onSite?: (siteId: string) => void }) {
  const { t } = useLanguage();
  const [activity, setActivity] = useState<MapPoint[]>([]); const [sites, setSites] = useState<MapPoint[]>(siteCache || []);
  const [showCatalogue, setShowCatalogue] = useState(false); const [region, setRegion] = useState(initialRegion); const [error, setError] = useState(false);
  useEffect(() => { api<{ points: MapPoint[] }>("/api/map").then((result) => setActivity(result.points)).catch(() => setError(true)); }, []);
  useEffect(() => { if (showCatalogue && !sites.length) void loadSites().then(setSites).catch(() => setError(true)); }, [showCatalogue, sites.length]);

  const visibleSites = useMemo(() => {
    if (!showCatalogue) return [];
    const latPad = region.latitudeDelta * 0.65; const lonPad = region.longitudeDelta * 0.65;
    return sites.filter((site) => Math.abs(site.latitude - region.latitude) <= latPad && Math.abs(site.longitude - region.longitude) <= lonPad).slice(0, 1800);
  }, [region, showCatalogue, sites]);
  const points = [...activity, ...visibleSites];
  const pin = (point: MapPoint) => point.type === "plan" ? colors.planned : point.type === "site" ? (point.siteSource === "EMODNET_WRECK" ? "#c93042" : "#e3ad00") : point.source === "friend" ? "#65a4d8" : colors.blue;

  return <View style={styles.wrapper}>
    {allowCatalogue ? <View style={styles.filters}><Pressable style={[styles.filter, !showCatalogue && styles.filterActive]} onPress={() => setShowCatalogue(false)}><Text style={[styles.filterText, !showCatalogue && styles.filterTextActive]}>{t("activity")} ({activity.length})</Text></Pressable><Pressable style={[styles.filter, showCatalogue && styles.filterActive]} onPress={() => setShowCatalogue(true)}><Text style={[styles.filterText, showCatalogue && styles.filterTextActive]}>{t("catalogue")} {showCatalogue && sites.length ? `(${sites.length})` : ""}</Text></Pressable></View> : null}
    <MapView provider={PROVIDER_DEFAULT} style={[styles.map, { height }]} initialRegion={initialRegion} onRegionChangeComplete={setRegion} mapType="standard" showsCompass showsScale>
      {points.map((point) => <Marker key={`${point.type}-${point.id}`} coordinate={{ latitude: point.latitude, longitude: point.longitude }} pinColor={pin(point)} tracksViewChanges={false} onPress={() => point.type === "site" && onSite?.(point.id)}>
        <Callout onPress={() => point.type === "site" && onSite?.(point.id)}><View style={styles.callout}><Text style={styles.calloutTitle}>{point.siteName}</Text><Text>{point.type === "plan" ? t("planning") : point.type === "site" ? (point.siteSource === "EMODNET_WRECK" ? t("wrecks") : t("sites")) : t("logbook")}</Text>{point.owner?.username ? <Text>@{point.owner.username}</Text> : null}{point.type === "site" ? <Text style={styles.open}>{t("viewProfile")} ›</Text> : null}</View></Callout>
      </Marker>)}
    </MapView>
    <Text style={styles.legend}><Text style={{ color: colors.blue }}>●</Text> {t("completed")}  <Text style={{ color: colors.planned }}>●</Text> {t("upcoming")}  <Text style={{ color: "#e3ad00" }}>●</Text> {t("sites")}  <Text style={{ color: "#c93042" }}>●</Text> {t("wrecks")}</Text>
    {showCatalogue && sites.length > visibleSites.length ? <Text style={styles.hint}>{visibleSites.length} / {sites.length} · {t("tapMarker")}</Text> : null}
    {error ? <Text style={styles.error}>{t("error")}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({ wrapper: { gap: 9 }, map: { width: "100%", borderRadius: 18, overflow: "hidden" }, filters: { flexDirection: "row", gap: 8 }, filter: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "white" }, filterActive: { backgroundColor: colors.deep, borderColor: colors.deep }, filterText: { textAlign: "center", fontWeight: "800", color: colors.muted, fontSize: 12 }, filterTextActive: { color: "white" }, callout: { minWidth: 180, maxWidth: 240, padding: 4, gap: 4 }, calloutTitle: { fontWeight: "900", fontSize: 15, color: colors.text }, open: { color: colors.blue, fontWeight: "800", marginTop: 4 }, legend: { color: colors.muted, fontSize: 11, textAlign: "center" }, hint: { color: colors.muted, textAlign: "center", fontSize: 12 }, error: { color: colors.danger, textAlign: "center" } });
