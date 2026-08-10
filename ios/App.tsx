import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api } from "./src/api";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { LanguageProvider, useLanguage } from "./src/i18n";
import { colors } from "./src/theme";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LogbookScreen } from "./src/screens/LogbookScreen";
import { FriendsScreen } from "./src/screens/FriendsScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { PlanningScreen } from "./src/screens/PlanningScreen";
import { ReviewsScreen } from "./src/screens/ReviewsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { PublicProfileScreen } from "./src/screens/PublicProfileScreen";
import { SiteDetailScreen } from "./src/screens/SiteDetailScreen";
import { AdminScreen } from "./src/screens/AdminScreen";

enableScreens();
const Stack = createNativeStackNavigator(); const Tabs = createBottomTabNavigator();
const icons: Record<string, string> = { Overview: "⌂", Logbook: "⚓", Friends: "◎", Map: "⌖", More: "•••" };

function MainTabs() {
  const { t } = useLanguage(); const [pending, setPending] = useState(0);
  useEffect(() => { let active = true; const load = () => void api<{ incoming: unknown[] }>("/api/friends").then((result) => active && setPending(result.incoming.length)).catch(() => undefined); load(); const timer = setInterval(load, 30000); return () => { active = false; clearInterval(timer); }; }, []);
  return <Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: "#718997", tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel, tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>{icons[route.name]}</Text> })}>
    <Tabs.Screen name="Overview" component={DashboardScreen} options={{ title: t("overview") }} />
    <Tabs.Screen name="Logbook" component={LogbookScreen} options={{ title: t("logbook") }} />
    <Tabs.Screen name="Friends" component={FriendsScreen} options={{ title: t("friends"), tabBarBadge: pending || undefined, tabBarBadgeStyle: styles.badge }} />
    <Tabs.Screen name="Map" component={MapScreen} options={{ title: t("map") }} />
    <Tabs.Screen name="More" component={MoreScreen} options={{ title: t("more") }} />
  </Tabs.Navigator>;
}

function Router() {
  const { user, loading } = useAuth(); const { setLocale, t } = useLanguage();
  useEffect(() => { if (user?.locale) setLocale(user.locale); }, [setLocale, user?.locale]);
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.aqua} /><Text style={styles.loadingText}>BlueMates</Text></View>;
  if (!user) return <AuthScreen />;
  return <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.blue, background: colors.pale, card: "white", text: colors.text, border: colors.border } }} linking={{ prefixes: ["bluemates://"], config: { screens: { PublicProfile: "profile/:publicId", SiteDetail: "sites/:siteId" } } }}>
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.navy }, headerTintColor: "white", headerTitleStyle: { fontWeight: "800" }, headerBackTitle: t("close"), contentStyle: { backgroundColor: colors.pale } }}>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Planning" component={PlanningScreen} options={{ title: t("planning") }} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: t("reviews") }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t("profile") }} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: t("viewProfile") }} />
      <Stack.Screen name="SiteDetail" component={SiteDetailScreen} options={{ title: t("site") }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: t("admin") }} />
    </Stack.Navigator>
  </NavigationContainer>;
}

export default function App() {
  return <SafeAreaProvider><LanguageProvider><AuthProvider><StatusBar style="light" /><Router /></AuthProvider></LanguageProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, gap: 12 }, loadingText: { color: "white", fontWeight: "900", fontSize: 22 }, tabBar: { height: 84, paddingTop: 7, paddingBottom: 16, borderTopColor: colors.border }, tabLabel: { fontWeight: "800", fontSize: 10 }, tabIcon: { fontSize: 20, fontWeight: "900" }, badge: { backgroundColor: colors.danger, color: "white" } });
