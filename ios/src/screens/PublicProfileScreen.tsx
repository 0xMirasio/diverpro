import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { api, mediaSource } from "../api";
import { useLanguage } from "../i18n";
import { colors } from "../theme";
import type { PublicProfile } from "../types";
import { Button, Card, Loader, Screen, SectionTitle, Title } from "../ui";

export function PublicProfileScreen() {
  const { params } = useRoute<any>(); const navigation = useNavigation<any>(); const { locale, t } = useLanguage(); const [profile, setProfile] = useState<PublicProfile | null>(null); const [error, setError] = useState(false);
  const load = useCallback(async () => { try { setProfile((await api<{ profile: PublicProfile }>(`/api/profiles/${encodeURIComponent(params.publicId)}`)).profile); } catch { setError(true); } }, [params.publicId]); useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!profile) return <Screen>{error ? <Text>{t("error")}</Text> : <Loader />}</Screen>;
  const name = profile.firstName ? `${profile.firstName} ${profile.lastName || ""}` : `@${profile.username}`; const points = [...profile.dives, ...profile.plans].filter((item) => item.latitude != null && item.longitude != null); const avatar = mediaSource(profile.avatarUrl);
  const profileId = profile.publicId;
  async function connect() { await api("/api/friends/requests", { method: "POST", body: JSON.stringify({ identifier: profileId }) }); await load(); }
  return <Screen><View style={styles.hero}>{avatar ? <Image source={avatar} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initials}>{profile.username.slice(0, 2).toUpperCase()}</Text></View>}<View style={styles.grow}><Title title={name} subtitle={`@${profile.username} · ${profile.publicId}`} />{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}</View></View>
    {!profile.self && !profile.relationship ? <Button title={t("connect")} onPress={() => void connect()} /> : profile.relationship ? <Card><Text style={styles.relationship}>{profile.relationship.status === "ACCEPTED" ? `✓ ${t("friends")}` : `◷ ${t("pending")}`}</Text></Card> : null}
    {!profile.full ? <Card><Text style={styles.private}>{t("hiddenProfile")}</Text></Card> : <>
      {points.length ? <Card><Text style={styles.mapTitle}>{t("mapTitle")}</Text><MapView style={styles.map} initialRegion={{ latitude: points[0]!.latitude!, longitude: points[0]!.longitude!, latitudeDelta: 80, longitudeDelta: 80 }}>{points.map((point) => <Marker key={point.id} coordinate={{ latitude: point.latitude!, longitude: point.longitude! }} pinColor={(point as any).plannedFor ? colors.planned : colors.blue} title={point.siteName} />)}</MapView></Card> : null}
      <SectionTitle count={profile.dives.length}>{t("logbook")}</SectionTitle>{profile.dives.map((dive) => <Card key={dive.id}><Text style={styles.site}>{dive.siteName}</Text><Text style={styles.meta}>{new Date(dive.date).toLocaleDateString(locale)} · {dive.depthM} m · {dive.durationMinutes} min</Text>{dive.details ? <Text>{dive.details}</Text> : null}</Card>)}
      <SectionTitle count={profile.plans.length}>{t("planning")}</SectionTitle>{profile.plans.map((plan) => <Card key={plan.id}><Text style={styles.site}>{plan.siteName}</Text><Text style={styles.plan}>{new Date(plan.plannedFor).toLocaleDateString(locale)} — {new Date(plan.plannedUntil).toLocaleDateString(locale)}</Text>{plan.details ? <Text>{plan.details}</Text> : null}</Card>)}
      <SectionTitle count={profile.reviews.length}>{t("reviews")}</SectionTitle>{profile.reviews.map((review) => <Card key={review.id}><Text style={styles.site}>{review.siteName}</Text><Text style={styles.stars}>{"★".repeat(review.rating)}</Text>{review.comment ? <Text>{review.comment}</Text> : null}</Card>)}
    </>}
    <Button title={t("close")} onPress={() => navigation.goBack()} variant="secondary" />
  </Screen>;
}

const styles = StyleSheet.create({ hero: { flexDirection: "row", gap: 14, alignItems: "center" }, grow: { flex: 1 }, avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", overflow: "hidden" }, initials: { color: "white", fontSize: 22, fontWeight: "900" }, bio: { color: colors.text, lineHeight: 20 }, relationship: { color: colors.success, fontWeight: "900", textAlign: "center" }, private: { color: colors.muted, textAlign: "center", padding: 18 }, mapTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, map: { height: 300, borderRadius: 14 }, site: { color: colors.text, fontSize: 17, fontWeight: "900" }, meta: { color: colors.blue, fontWeight: "700" }, plan: { color: colors.planned, fontWeight: "800" }, stars: { color: "#e3ad00", fontSize: 18 } });
