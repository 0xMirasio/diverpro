import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { api } from "./api";
import { colors } from "./theme";
import type { Place } from "./types";
import { Button, Field, Notice } from "./ui";
import { useLanguage } from "./i18n";

export type SelectedPlace = { name: string; latitude: number; longitude: number };

export function LocationPicker({ value, onChange }: { value: SelectedPlace | null; onChange: (place: SelectedPlace) => void }) {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (query.trim().length < 3) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ places: Place[] }>(`/api/geocoding/search?q=${encodeURIComponent(query.trim())}&lang=${locale}`);
      setPlaces(result.places);
    } catch { setError(t("error")); } finally { setBusy(false); }
  }

  async function gps() {
    setBusy(true); setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("denied");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      const result = await api<{ place: Place | null }>(`/api/geocoding/reverse?lat=${latitude}&lon=${longitude}&lang=${locale}`);
      onChange({ name: result.place?.name || result.place?.label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude });
      setPlaces([]);
    } catch { setError(t("error")); } finally { setBusy(false); }
  }

  return <View style={styles.wrapper}>
    <Field label={t("location")} value={query} onChangeText={setQuery} placeholder={t("findPlace")} />
    <View style={styles.actions}><View style={styles.action}><Button title={busy ? t("loading") : t("search")} onPress={search} disabled={busy || query.trim().length < 3} variant="secondary" compact /></View><View style={styles.action}><Button title={t("useLocation")} onPress={gps} disabled={busy} variant="secondary" compact /></View></View>
    {places.map((place, index) => <Pressable key={`${place.latitude}-${place.longitude}-${index}`} style={styles.place} onPress={() => { onChange({ name: place.name || place.label || query, latitude: place.latitude, longitude: place.longitude }); setPlaces([]); setQuery(place.name || place.label || query); }}><Text style={styles.placeName}>{place.name || place.label}</Text>{place.label && place.label !== place.name ? <Text style={styles.placeLabel}>{place.label}</Text> : null}<Text style={styles.coords}>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text></Pressable>)}
    {value ? <View style={styles.selected}><Text style={styles.selectedLabel}>{t("selected")}</Text><Text style={styles.placeName}>{value.name}</Text><Text style={styles.coords}>{value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</Text></View> : null}
    {error ? <Notice text={error} error /> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 }, actions: { flexDirection: "row", gap: 8 }, action: { flex: 1 },
  place: { backgroundColor: "#f5fbfd", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11, gap: 3 }, placeName: { color: colors.text, fontWeight: "800" }, placeLabel: { color: colors.muted, fontSize: 13 }, coords: { color: colors.blue, fontFamily: "Courier", fontSize: 12 }, selected: { backgroundColor: "#e7f8f5", borderRadius: 12, padding: 12, gap: 3 }, selectedLabel: { color: colors.success, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
});
