import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../i18n";
import { colors } from "../theme";
import { Card, LanguagePicker, Screen, Title } from "../ui";

export function MoreScreen() {
  const navigation = useNavigation<any>(); const { user } = useAuth(); const { t } = useLanguage();
  const links = [{ route: "Planning", icon: "◷", label: t("planning") }, { route: "Reviews", icon: "★", label: t("reviews") }, { route: "Profile", icon: "◎", label: t("profile") }, ...(user?.role === "ADMIN" ? [{ route: "Admin", icon: "⚙", label: t("admin") }] : [])];
  return <Screen><Title title="BlueMates" subtitle={`@${user?.username || "diver"} · ${user?.publicId || ""}`} /><Card><LanguagePicker /></Card>{links.map((link) => <Pressable key={link.route} onPress={() => navigation.navigate(link.route)}><Card><View style={styles.row}><Text style={styles.icon}>{link.icon}</Text><Text style={styles.label}>{link.label}</Text><Text style={styles.arrow}>›</Text></View></Card></Pressable>)}<Text style={styles.version}>BlueMates iOS version 1.0.0</Text></Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 14 }, icon: { color: colors.blue, fontSize: 24, width: 30, textAlign: "center" }, label: { color: colors.text, fontSize: 17, fontWeight: "900", flex: 1 }, arrow: { color: colors.muted, fontSize: 28 }, version: { color: colors.muted, textAlign: "center", marginTop: 20 } });
