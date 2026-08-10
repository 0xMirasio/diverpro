import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../i18n";
import { MapPanel } from "../MapPanel";
import { colors } from "../theme";
import type { Dive, Plan } from "../types";
import { Card, Screen, Title } from "../ui";

export function DashboardScreen() {
  const navigation = useNavigation<any>(); const { user } = useAuth(); const { t } = useLanguage();
  const [counts, setCounts] = useState({ dives: 0, plans: 0, friends: 0, incoming: 0 }); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { const [dives, plans, friends] = await Promise.all([api<{ dives: Dive[] }>("/api/dives"), api<{ plans: Plan[] }>("/api/plans"), api<{ friends: unknown[]; incoming: unknown[] }>("/api/friends")]); setCounts({ dives: dives.dives.reduce((sum, dive) => sum + dive.groupCount, 0), plans: plans.plans.length, friends: friends.friends.length, incoming: friends.incoming.length }); } finally { setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const cards = [
    { key: "Logbook", label: t("logbook"), value: counts.dives, sub: t("completed"), icon: "⚓" },
    { key: "Planning", label: t("planning"), value: counts.plans, sub: t("upcoming"), icon: "◷" },
    { key: "Friends", label: t("friends"), value: counts.friends, sub: counts.incoming ? `${counts.incoming} ${t("pending")}` : t("friends"), icon: "◎", badge: counts.incoming },
    { key: "Reviews", label: t("reviews"), value: "★", sub: t("site"), icon: "✦" },
  ];
  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.aqua} />}>
    <View style={styles.hero}><Text style={styles.hello}>BlueMates · @{user?.username}</Text><Text style={styles.heroTitle}>{t("dashboardTitle")}</Text><Text style={styles.heroSub}>{t("dashboardSub")}</Text></View>
    <View style={styles.grid}>{cards.map((card) => <Pressable key={card.key} style={styles.gridItem} onPress={() => navigation.navigate(card.key)}><Card style={styles.metric}><View style={styles.metricTop}><Text style={styles.icon}>{card.icon}</Text>{card.badge ? <Text style={styles.badge}>{card.badge}</Text> : null}</View><Text style={styles.value}>{card.value}</Text><Text style={styles.label}>{card.label}</Text><Text style={styles.sub}>{card.sub}</Text></Card></Pressable>)}</View>
    <Card><View style={styles.mapHeading}><Text style={styles.mapTitle}>{t("world")}</Text><Pressable onPress={() => navigation.navigate("Map")}><Text style={styles.open}>↗ {t("map")}</Text></Pressable></View><MapPanel height={330} allowCatalogue={false} onSite={(id) => navigation.navigate("SiteDetail", { siteId: id })} /></Card>
  </Screen>;
}

const styles = StyleSheet.create({ hero: { backgroundColor: colors.deep, marginHorizontal: -18, marginTop: -18, padding: 22, paddingTop: 28 }, hello: { color: colors.aqua, fontWeight: "900", marginBottom: 9 }, heroTitle: { color: "white", fontSize: 28, lineHeight: 34, fontWeight: "900" }, heroSub: { color: "#b8dce5", fontSize: 15, lineHeight: 21, marginTop: 5 }, grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 }, gridItem: { width: "50%", padding: 5 }, metric: { minHeight: 155 }, metricTop: { flexDirection: "row", justifyContent: "space-between" }, icon: { fontSize: 23, color: colors.blue }, badge: { color: "white", backgroundColor: colors.danger, borderRadius: 13, overflow: "hidden", minWidth: 26, height: 26, textAlign: "center", paddingTop: 3, fontWeight: "900" }, value: { color: colors.navy, fontSize: 27, fontWeight: "900" }, label: { color: colors.text, fontWeight: "900" }, sub: { color: colors.muted, fontSize: 12 }, mapHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, mapTitle: { fontWeight: "900", fontSize: 19, color: colors.text }, open: { color: colors.blue, fontWeight: "800" } });
