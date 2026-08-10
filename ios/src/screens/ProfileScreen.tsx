import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, mediaSource, uploadImage } from "../api";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../i18n";
import { PhotoPicker } from "../PhotoPicker";
import { colors } from "../theme";
import type { Locale, User, Visibility } from "../types";
import { Button, Card, Field, LanguagePicker, Loader, Notice, Screen, Title, VisibilityToggle } from "../ui";

export function ProfileScreen() {
  const { user, refresh, logout } = useAuth(); const { locale, setLocale, t } = useLanguage(); const [form, setForm] = useState({ firstName: "", lastName: "", username: "", bio: "" }); const [birthDate, setBirthDate] = useState<Date | null>(null); const [profileVisibility, setProfileVisibility] = useState<Visibility>("PUBLIC"); const [logbookVisibility, setLogbookVisibility] = useState<Visibility>("PUBLIC"); const [avatar, setAvatar] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { if (user) { setForm({ firstName: user.firstName || "", lastName: user.lastName || "", username: user.username, bio: user.bio || "" }); setBirthDate(user.birthDate ? new Date(user.birthDate) : null); setProfileVisibility(user.profileVisibility || "PUBLIC"); setLogbookVisibility(user.logbookVisibility || "PUBLIC"); if (user.locale) setLocale(user.locale); } }, [setLocale, user]);
  if (!user) return <Screen><Loader /></Screen>; const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function save() { setBusy(true); setMessage(""); try { let avatarMediaId: string | undefined; if (avatar[0]) avatarMediaId = (await uploadImage(avatar[0], "AVATAR")).media.id; await api<{ user: User }>("/api/profile", { method: "PATCH", body: JSON.stringify({ ...form, birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : null, profileVisibility, logbookVisibility, locale, avatarMediaId }) }); await refresh(); setAvatar([]); setMessage(t("saved")); } catch { setMessage(t("error")); } finally { setBusy(false); } }
  const source = avatar[0] ? { uri: avatar[0] } : mediaSource(user.avatarUrl);
  return <Screen><Title title={t("profileTitle")} subtitle={t("profileSub")} /><Card><View style={styles.identity}>{source ? <Image source={source} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initials}>{user.username.slice(0, 2).toUpperCase()}</Text></View>}<View style={styles.grow}><Text style={styles.username}>@{user.username}</Text><Text style={styles.member}>{t("memberId")}: {user.publicId}</Text></View></View><Text style={styles.label}>{t("avatar")}</Text><PhotoPicker uris={avatar} onChange={setAvatar} multiple={false} /></Card>
    <Card><View style={styles.row}><View style={styles.half}><Field label={t("firstName")} value={form.firstName} onChangeText={set("firstName")} autoCapitalize="words" /></View><View style={styles.half}><Field label={t("lastName")} value={form.lastName} onChangeText={set("lastName")} autoCapitalize="words" /></View></View><Field label={t("username")} value={form.username} onChangeText={set("username")} autoCapitalize="none" /><Field label={t("bio")} value={form.bio} onChangeText={set("bio")} multiline /><Text style={styles.label}>{t("birthDate")}</Text><DateTimePicker value={birthDate || new Date(1990, 0, 1)} mode="date" maximumDate={new Date()} onChange={(_, value) => value && setBirthDate(value)} /></Card>
    <Card><VisibilityToggle label={t("profileVisibility")} value={profileVisibility} onChange={setProfileVisibility} /><VisibilityToggle label={t("logbookVisibility")} value={logbookVisibility} onChange={setLogbookVisibility} /><Text style={styles.label}>{t("defaultLanguage")}</Text><LanguagePicker /></Card>
    {message ? <Notice text={message} error={message === t("error")} /> : null}<Button title={busy ? t("loading") : t("save")} onPress={() => void save()} disabled={busy} /><Button title={t("signOut")} onPress={() => void logout()} variant="danger" />
  </Screen>;
}

const styles = StyleSheet.create({ identity: { flexDirection: "row", gap: 13, alignItems: "center" }, avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", overflow: "hidden" }, initials: { color: "white", fontWeight: "900", fontSize: 21 }, grow: { flex: 1 }, username: { color: colors.text, fontSize: 19, fontWeight: "900" }, member: { color: colors.muted, fontFamily: "Courier", marginTop: 4, fontSize: 12 }, label: { color: colors.text, fontWeight: "800" }, row: { flexDirection: "row", gap: 9 }, half: { flex: 1 } });
