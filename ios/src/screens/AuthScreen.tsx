import React, { useEffect, useState } from "react";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../i18n";
import { colors, shadow } from "../theme";
import { Button, Field, LanguagePicker, Notice } from "../ui";

export function AuthScreen() {
  const { login, register } = useAuth();
  const { locale, t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => setError(""), [mode]);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    setBusy(true); setError("");
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ ...form, locale });
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : "";
      setError(code === "USERNAME_TAKEN" ? t("usernameTaken") : code === "EMAIL_TAKEN" ? t("emailTaken") : code === "INVALID_CREDENTIALS" ? t("invalidCredentials") : t("error"));
    } finally { setBusy(false); }
  }
  const valid = form.email.includes("@") && form.password.length >= (mode === "register" ? 8 : 1) && (mode === "login" || Boolean(form.firstName && form.lastName && form.username.length >= 3));

  return <ImageBackground source={require("../../assets/scuba-hero.png")} style={styles.background} imageStyle={styles.backgroundImage}>
    <View style={styles.tint} />
    <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}><Text style={styles.logo}>BlueMates</Text><Text style={styles.tagline}>{t("welcome")}</Text><LanguagePicker /></View>
      <View style={styles.panel}>
        <View style={styles.tabs}>{(["login", "register"] as const).map((item) => <Pressable key={item} style={[styles.tab, mode === item && styles.tabActive]} onPress={() => setMode(item)}><Text style={[styles.tabText, mode === item && styles.tabTextActive]}>{t(item)}</Text></Pressable>)}</View>
        {mode === "register" ? <><View style={styles.row}><View style={styles.half}><Field label={t("firstName")} value={form.firstName} onChangeText={set("firstName")} autoCapitalize="words" /></View><View style={styles.half}><Field label={t("lastName")} value={form.lastName} onChangeText={set("lastName")} autoCapitalize="words" /></View></View><Field label={t("username")} value={form.username} onChangeText={set("username")} autoCapitalize="none" /></> : null}
        <Field label={t("email")} value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
        <Field label={t("password")} value={form.password} onChangeText={set("password")} secureTextEntry autoCapitalize="none" />
        {error ? <Notice text={error} error /> : null}
        <Button title={busy ? t("loading") : t(mode)} onPress={submit} disabled={busy || !valid} />
        <View style={styles.google}><Text style={styles.googleText}>G</Text><Text style={styles.googleLabel}>{t("googleSoon")}</Text></View>
      </View>
      <Text style={styles.version}>BlueMates iOS 1.0.0</Text>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>
  </ImageBackground>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.navy }, backgroundImage: { opacity: 0.82 }, tint: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,24,43,.48)" }, safe: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 24 },
  brand: { alignItems: "center", gap: 9 }, logo: { color: "white", fontSize: 39, fontWeight: "900", letterSpacing: -1 }, tagline: { color: "#d9f8fb", fontSize: 17, fontWeight: "600" }, panel: { backgroundColor: "rgba(255,255,255,.96)", borderRadius: 24, padding: 18, gap: 14, ...shadow }, tabs: { flexDirection: "row", backgroundColor: colors.pale, borderRadius: 13, padding: 4 }, tab: { flex: 1, padding: 11, alignItems: "center", borderRadius: 10 }, tabActive: { backgroundColor: colors.deep }, tabText: { color: colors.muted, fontWeight: "800" }, tabTextActive: { color: "white" }, row: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, google: { minHeight: 46, flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5 }, googleText: { fontWeight: "900", color: colors.blue, fontSize: 18 }, googleLabel: { color: colors.muted, fontWeight: "700" }, version: { color: "white", textAlign: "center", fontWeight: "700" },
});
