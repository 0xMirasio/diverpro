import React from "react";
import { ActivityIndicator, KeyboardTypeOptions, Pressable, RefreshControlProps, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadow } from "./theme";
import { useLanguage } from "./i18n";
import type { Visibility } from "./types";

export function Screen({ children, refreshControl }: React.PropsWithChildren<{ refreshControl?: React.ReactElement<RefreshControlProps> }>) {
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{children}</ScrollView></SafeAreaView>;
}
export function Title({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={styles.title}><Text style={styles.h1}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>; }
export function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ title, onPress, variant = "primary", disabled, compact }: { title: string; onPress: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; disabled?: boolean; compact?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, styles[`button_${variant}`], compact && styles.buttonCompact, (pressed || disabled) && styles.buttonMuted]}><Text style={[styles.buttonText, variant !== "primary" && styles[`buttonText_${variant}`]]}>{title}</Text></Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, autoCapitalize = "sentences" }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: KeyboardTypeOptions; multiline?: boolean; autoCapitalize?: "none" | "sentences" | "words" | "characters" }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#86a0ae" secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} autoCapitalize={autoCapitalize} style={[styles.input, multiline && styles.multiline]} /></View>;
}
export function VisibilityToggle({ value, onChange, label }: { value: Visibility; onChange: (value: Visibility) => void; label?: string }) {
  const { t } = useLanguage(); return <View style={styles.toggleRow}><View><Text style={styles.label}>{label || t("visibility")}</Text><Text style={styles.hint}>{value === "PUBLIC" ? t("public") : t("private")}</Text></View><Switch value={value === "PUBLIC"} onValueChange={(checked) => onChange(checked ? "PUBLIC" : "PRIVATE")} trackColor={{ false: "#b4c4ca", true: colors.aqua }} thumbColor="#fff" /></View>;
}
export function LanguagePicker() {
  const { locale, setLocale } = useLanguage(); return <View style={styles.languageRow}>{(["en", "fr", "es"] as const).map((item) => <Pressable key={item} onPress={() => setLocale(item)} style={[styles.language, locale === item && styles.languageActive]}><Text style={[styles.languageText, locale === item && styles.languageTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>;
}
export function Loader() { const { t } = useLanguage(); return <View style={styles.loader}><ActivityIndicator color={colors.aqua} /><Text>{t("loading")}</Text></View>; }
export function Notice({ text, error }: { text: string; error?: boolean }) { return <Text style={[styles.notice, error && styles.noticeError]}>{text}</Text>; }
export function SectionTitle({ children, count }: React.PropsWithChildren<{ count?: number }>) { return <View style={styles.sectionTitle}><Text style={styles.h2}>{children}</Text>{count != null ? <Text style={styles.pill}>{count}</Text> : null}</View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pale }, screen: { padding: 18, paddingBottom: 110, gap: 14 },
  title: { gap: 5, marginBottom: 4 }, h1: { fontSize: 29, lineHeight: 34, fontWeight: "800", color: colors.navy }, subtitle: { fontSize: 15, color: colors.muted, lineHeight: 21 }, h2: { fontSize: 19, fontWeight: "800", color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12, ...shadow },
  button: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.blue }, buttonCompact: { minHeight: 38, paddingHorizontal: 13 }, button_primary: { backgroundColor: colors.blue }, button_secondary: { backgroundColor: colors.pale, borderWidth: 1, borderColor: colors.blue }, button_danger: { backgroundColor: "#fff0f2", borderWidth: 1, borderColor: "#efb4be" }, button_ghost: { backgroundColor: "transparent" }, buttonMuted: { opacity: 0.55 }, buttonText: { color: "white", fontWeight: "800", fontSize: 15 }, buttonText_secondary: { color: colors.blue }, buttonText_danger: { color: colors.danger }, buttonText_ghost: { color: colors.blue },
  field: { gap: 6 }, label: { color: colors.text, fontWeight: "700", fontSize: 14 }, hint: { color: colors.muted, fontSize: 12, marginTop: 2 }, input: { minHeight: 48, borderRadius: 13, backgroundColor: "#f7fbfc", borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, color: colors.text, fontSize: 16 }, multiline: { minHeight: 100, paddingTop: 12, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, languageRow: { flexDirection: "row", gap: 7 }, language: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 }, languageActive: { backgroundColor: colors.deep, borderColor: colors.deep }, languageText: { color: colors.muted, fontWeight: "800" }, languageTextActive: { color: "white" },
  loader: { padding: 30, alignItems: "center", gap: 10 }, notice: { color: colors.success, padding: 10, backgroundColor: "#eaf9f2", borderRadius: 10, overflow: "hidden" }, noticeError: { color: colors.danger, backgroundColor: "#fff0f2" }, sectionTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, pill: { color: colors.blue, backgroundColor: "#dff4fa", borderRadius: 20, overflow: "hidden", paddingVertical: 4, paddingHorizontal: 10, fontWeight: "800" },
});
