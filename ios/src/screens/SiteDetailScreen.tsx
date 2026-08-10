import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { api, mediaSource } from "../api";
import { useLanguage } from "../i18n";
import { colors } from "../theme";
import type { Site } from "../types";
import { Button, Card, Field, Loader, Notice, Screen, SectionTitle, Title } from "../ui";

export function SiteDetailScreen() {
  const { params } = useRoute<any>(); const navigation = useNavigation<any>(); const { t } = useLanguage(); const [site, setSite] = useState<Site | null>(null); const [description, setDescription] = useState(""); const [editing, setEditing] = useState(false); const [message, setMessage] = useState("");
  const load = useCallback(async () => { try { const result = await api<{ site: Site }>(`/api/sites/${params.siteId}`); setSite(result.site); setDescription(result.site.description || ""); } catch { setMessage(t("error")); } }, [params.siteId, t]); useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function save() { try { await api(`/api/sites/${params.siteId}`, { method: "PATCH", body: JSON.stringify({ description }) }); setEditing(false); setMessage(t("saved")); await load(); } catch { setMessage(t("error")); } }
  if (!site) return <Screen>{message ? <Notice text={message} error /> : <Loader />}</Screen>;
  const name = site.name || site.siteName || t("site"); const wreck = site.source === "EMODNET_WRECK" || site.siteSource === "EMODNET_WRECK";
  return <Screen><Title title={name} subtitle={`${wreck ? t("wrecks") : t("sites")} · ${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}`} /><Card><MapView style={styles.map} initialRegion={{ latitude: site.latitude, longitude: site.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }}><Marker coordinate={{ latitude: site.latitude, longitude: site.longitude }} pinColor={wreck ? "#c93042" : "#e3ad00"} title={name} /></MapView></Card>
    <Card>{editing ? <><Field label={t("details")} value={description} onChangeText={setDescription} multiline /><View style={styles.row}><View style={styles.half}><Button title={t("cancel")} onPress={() => setEditing(false)} variant="secondary" /></View><View style={styles.half}><Button title={t("save")} onPress={() => void save()} /></View></View></> : <><Text style={styles.description}>{site.description || "—"}</Text><Button title={t("edit")} onPress={() => setEditing(true)} variant="secondary" /></>}</Card>
    {message ? <Notice text={message} error={message === t("error")} /> : null}<SectionTitle count={site.reviews?.length || 0}>{t("reviews")}</SectionTitle>{site.reviews?.length ? site.reviews.map((review) => <Card key={review.id}><Text style={styles.author}>{review.user?.username ? `@${review.user.username}` : "BlueMates"}</Text><Text style={styles.stars}>{"★".repeat(review.rating)}</Text>{review.comment ? <Text>{review.comment}</Text> : null}{review.photos.length ? <View style={styles.photos}>{review.photos.map((photo) => <Image key={photo.id} source={mediaSource(`/api/media/${photo.id}`)} style={styles.photo} />)}</View> : null}</Card>) : <Card><Text style={styles.empty}>{t("empty")}</Text></Card>}
    <Button title={t("close")} onPress={() => navigation.goBack()} variant="secondary" />
  </Screen>;
}

const styles = StyleSheet.create({ map: { height: 360, borderRadius: 15 }, description: { color: colors.text, lineHeight: 21 }, row: { flexDirection: "row", gap: 9 }, half: { flex: 1 }, author: { color: colors.blue, fontWeight: "900" }, stars: { color: "#e3ad00", fontSize: 20 }, empty: { color: colors.muted, textAlign: "center" }, photos: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, photo: { width: 78, height: 78, borderRadius: 11 } });
