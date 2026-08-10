import React, { useCallback, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { api, mediaSource, uploadImage } from "../api";
import { useLanguage } from "../i18n";
import { LocationPicker, SelectedPlace } from "../LocationPicker";
import { PhotoPicker } from "../PhotoPicker";
import { colors } from "../theme";
import type { Dive, Visibility } from "../types";
import { Button, Card, Field, Notice, Screen, SectionTitle, Title, VisibilityToggle } from "../ui";

const today = () => new Date();
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function LogbookScreen() {
  const { locale, t } = useLanguage(); const [dives, setDives] = useState<Dive[]>([]); const [logbookVisibility, setLogbookVisibility] = useState<Visibility>("PUBLIC");
  const [open, setOpen] = useState(false); const [refreshing, setRefreshing] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const [date, setDate] = useState(today()); const [siteName, setSiteName] = useState(""); const [depth, setDepth] = useState(""); const [duration, setDuration] = useState(""); const [groupCount, setGroupCount] = useState("1"); const [details, setDetails] = useState(""); const [visibility, setVisibility] = useState<Visibility>("PUBLIC"); const [place, setPlace] = useState<SelectedPlace | null>(null); const [photos, setPhotos] = useState<string[]>([]);
  const load = useCallback(async () => { try { const result = await api<{ dives: Dive[]; logbookVisibility: Visibility }>("/api/dives"); setDives(result.dives); setLogbookVisibility(result.logbookVisibility); } finally { setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function updateLogbook(value: Visibility) { setLogbookVisibility(value); try { await api("/api/dives", { method: "PATCH", body: JSON.stringify({ logbookVisibility: value }) }); } catch { setLogbookVisibility(value === "PUBLIC" ? "PRIVATE" : "PUBLIC"); } }
  function reset() { setDate(today()); setSiteName(""); setDepth(""); setDuration(""); setGroupCount("1"); setDetails(""); setVisibility("PUBLIC"); setPlace(null); setPhotos([]); }
  async function create() {
    if (!siteName.trim() || !Number(depth) || !Number(duration)) return setMessage(t("error"));
    setBusy(true); setMessage("");
    try {
      const media = await Promise.all(photos.map((uri) => uploadImage(uri, "DIVE")));
      await api("/api/dives", { method: "POST", body: JSON.stringify({ date: isoDate(date), siteName: siteName.trim(), depthM: Number(depth), durationMinutes: Number(duration), groupCount: Number(groupCount) || 1, details, visibility, latitude: place?.latitude ?? null, longitude: place?.longitude ?? null, photoIds: media.map((item) => item.media.id) }) });
      reset(); setOpen(false); setMessage(t("created")); await load();
    } catch { setMessage(t("error")); } finally { setBusy(false); }
  }
  async function toggleDive(dive: Dive) { const next = dive.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"; await api(`/api/dives/${dive.id}`, { method: "PATCH", body: JSON.stringify({ visibility: next }) }); await load(); }
  function remove(dive: Dive) { Alert.alert(t("delete"), t("confirmDelete"), [{ text: t("cancel"), style: "cancel" }, { text: t("delete"), style: "destructive", onPress: () => void api(`/api/dives/${dive.id}`, { method: "DELETE" }).then(load) }]); }

  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.aqua} />}>
    <Title title={t("logbookTitle")} subtitle={t("logbookSub")} />
    <Card><VisibilityToggle value={logbookVisibility} onChange={updateLogbook} label={t("logbookVisibility")} /></Card>
    <Button title={open ? t("cancel") : `＋ ${t("add")}`} onPress={() => setOpen(!open)} variant={open ? "secondary" : "primary"} />
    {open ? <Card>
      <Text style={styles.formTitle}>{t("add")} · {t("logbook")}</Text>
      <Text style={styles.label}>{t("date")}</Text><DateTimePicker value={date} mode="date" maximumDate={new Date()} onChange={(_, value) => value && setDate(value)} />
      <Field label={t("site")} value={siteName} onChangeText={setSiteName} />
      <View style={styles.row}><View style={styles.half}><Field label={t("depth")} value={depth} onChangeText={setDepth} keyboardType="decimal-pad" /></View><View style={styles.half}><Field label={t("duration")} value={duration} onChangeText={setDuration} keyboardType="number-pad" /></View></View>
      <Field label={t("groupCount")} value={groupCount} onChangeText={setGroupCount} keyboardType="number-pad" />
      <Field label={t("details")} value={details} onChangeText={setDetails} multiline />
      <LocationPicker value={place} onChange={(value) => { setPlace(value); if (!siteName) setSiteName(value.name); }} />
      <PhotoPicker uris={photos} onChange={setPhotos} />
      <VisibilityToggle value={visibility} onChange={setVisibility} />
      <Button title={busy ? t("loading") : t("save")} onPress={create} disabled={busy} />
    </Card> : null}
    {message ? <Notice text={message} error={message === t("error")} /> : null}
    <SectionTitle count={dives.reduce((sum, dive) => sum + dive.groupCount, 0)}>{t("logbook")}</SectionTitle>
    {!dives.length ? <Card><Text style={styles.empty}>{t("noDives")}</Text></Card> : dives.map((dive) => <Card key={dive.id}>
      <View style={styles.entryTop}><View style={styles.entryTitle}><Text style={styles.site}>{dive.siteName}</Text><Text style={styles.date}>{new Date(dive.date).toLocaleDateString(locale)}</Text></View><Text style={[styles.visibility, dive.visibility === "PRIVATE" && styles.private]}>{dive.visibility === "PUBLIC" ? t("public") : t("private")}</Text></View>
      <Text style={styles.stats}>{dive.depthM} m · {dive.durationMinutes} min{dive.groupCount > 1 ? ` · ×${dive.groupCount}` : ""}</Text>{dive.details ? <Text style={styles.details}>{dive.details}</Text> : null}
      {dive.photos.length ? <View style={styles.photos}>{dive.photos.map((photo) => <Image key={photo.id} source={mediaSource(`/api/media/${photo.id}`)} style={styles.photo} />)}</View> : null}
      <View style={styles.row}><View style={styles.half}><Button title={dive.visibility === "PUBLIC" ? t("private") : t("public")} onPress={() => void toggleDive(dive)} variant="secondary" compact /></View><View style={styles.half}><Button title={t("delete")} onPress={() => remove(dive)} variant="danger" compact /></View></View>
    </Card>)}
  </Screen>;
}

const styles = StyleSheet.create({ formTitle: { fontSize: 19, fontWeight: "900", color: colors.text }, label: { color: colors.text, fontWeight: "700" }, row: { flexDirection: "row", gap: 9 }, half: { flex: 1 }, entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }, entryTitle: { flex: 1, gap: 3 }, site: { color: colors.text, fontSize: 18, fontWeight: "900" }, date: { color: colors.muted }, visibility: { color: colors.success, backgroundColor: "#e8f8f1", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, overflow: "hidden", fontSize: 11, fontWeight: "900" }, private: { color: colors.muted, backgroundColor: "#edf1f3" }, stats: { color: colors.blue, fontWeight: "800" }, details: { color: colors.text, lineHeight: 20 }, empty: { color: colors.muted, textAlign: "center" }, photos: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, photo: { width: 78, height: 78, borderRadius: 11 } });
