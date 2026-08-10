import React, { useCallback, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api";
import { useLanguage } from "../i18n";
import { LocationPicker, SelectedPlace } from "../LocationPicker";
import { colors } from "../theme";
import type { Plan, Visibility } from "../types";
import { Button, Card, Field, Notice, Screen, SectionTitle, Title, VisibilityToggle } from "../ui";

const midnight = () => { const date = new Date(); date.setHours(12, 0, 0, 0); return date; };
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function PlanningScreen() {
  const { locale, t } = useLanguage(); const [plans, setPlans] = useState<Plan[]>([]); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [refreshing, setRefreshing] = useState(false); const [message, setMessage] = useState("");
  const [start, setStart] = useState(midnight()); const [end, setEnd] = useState(midnight()); const [siteName, setSiteName] = useState(""); const [details, setDetails] = useState(""); const [visibility, setVisibility] = useState<Visibility>("PUBLIC"); const [place, setPlace] = useState<SelectedPlace | null>(null);
  const load = useCallback(async () => { try { setPlans((await api<{ plans: Plan[] }>("/api/plans")).plans); } finally { setRefreshing(false); } }, []); useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function create() { if (!siteName.trim() || end < start) return setMessage(t("error")); setBusy(true); try { await api("/api/plans", { method: "POST", body: JSON.stringify({ plannedFor: isoDate(start), plannedUntil: isoDate(end), siteName: siteName.trim(), details, visibility, latitude: place?.latitude ?? null, longitude: place?.longitude ?? null }) }); setOpen(false); setSiteName(""); setDetails(""); setPlace(null); setVisibility("PUBLIC"); setMessage(t("created")); await load(); } catch { setMessage(t("error")); } finally { setBusy(false); } }
  async function toggle(plan: Plan) { await api(`/api/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ visibility: plan.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC" }) }); await load(); }
  function remove(plan: Plan) { Alert.alert(t("delete"), t("confirmDelete"), [{ text: t("cancel"), style: "cancel" }, { text: t("delete"), style: "destructive", onPress: () => void api(`/api/plans/${plan.id}`, { method: "DELETE" }).then(load) }]); }
  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.aqua} />}>
    <Title title={t("planTitle")} subtitle={t("planSub")} /><Button title={open ? t("cancel") : `＋ ${t("add")}`} onPress={() => setOpen(!open)} variant={open ? "secondary" : "primary"} />
    {open ? <Card><Text style={styles.formTitle}>{t("add")} · {t("planning")}</Text><Text style={styles.label}>{t("startDate")}</Text><DateTimePicker value={start} mode="date" minimumDate={new Date()} onChange={(_, value) => { if (value) { setStart(value); if (end < value) setEnd(value); } }} /><Text style={styles.label}>{t("endDate")}</Text><DateTimePicker value={end} mode="date" minimumDate={start} onChange={(_, value) => value && setEnd(value)} /><Field label={t("site")} value={siteName} onChangeText={setSiteName} /><Field label={t("details")} value={details} onChangeText={setDetails} multiline /><LocationPicker value={place} onChange={(value) => { setPlace(value); if (!siteName) setSiteName(value.name); }} /><VisibilityToggle value={visibility} onChange={setVisibility} /><Button title={busy ? t("loading") : t("save")} onPress={create} disabled={busy} /></Card> : null}
    {message ? <Notice text={message} error={message === t("error")} /> : null}<SectionTitle count={plans.length}>{t("upcoming")}</SectionTitle>
    {!plans.length ? <Card><Text style={styles.empty}>{t("noPlans")}</Text></Card> : plans.map((plan) => <Card key={plan.id}><View style={styles.entryTop}><View style={styles.grow}><Text style={styles.site}>{plan.siteName}</Text><Text style={styles.date}>{new Date(plan.plannedFor).toLocaleDateString(locale)} — {new Date(plan.plannedUntil).toLocaleDateString(locale)}</Text></View><Text style={[styles.visibility, plan.visibility === "PRIVATE" && styles.private]}>{plan.visibility === "PUBLIC" ? t("public") : t("private")}</Text></View>{plan.details ? <Text style={styles.details}>{plan.details}</Text> : null}<View style={styles.row}><View style={styles.half}><Button title={plan.visibility === "PUBLIC" ? t("private") : t("public")} onPress={() => void toggle(plan)} variant="secondary" compact /></View><View style={styles.half}><Button title={t("delete")} onPress={() => remove(plan)} variant="danger" compact /></View></View></Card>)}
  </Screen>;
}

const styles = StyleSheet.create({ formTitle: { fontSize: 19, fontWeight: "900", color: colors.text }, label: { color: colors.text, fontWeight: "700" }, row: { flexDirection: "row", gap: 9 }, half: { flex: 1 }, entryTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, grow: { flex: 1 }, site: { color: colors.text, fontSize: 18, fontWeight: "900" }, date: { color: colors.planned, fontWeight: "800", marginTop: 4 }, visibility: { color: colors.success, backgroundColor: "#e8f8f1", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, overflow: "hidden", fontSize: 11, fontWeight: "900", alignSelf: "flex-start" }, private: { color: colors.muted, backgroundColor: "#edf1f3" }, details: { color: colors.text, lineHeight: 20 }, empty: { color: colors.muted, textAlign: "center" } });
