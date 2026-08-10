import React, { useCallback, useState } from "react";
import { Alert, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { api, mediaSource } from "../api";
import { useLanguage } from "../i18n";
import { colors } from "../theme";
import type { Diver } from "../types";
import { Button, Card, Field, Notice, Screen, SectionTitle, Title } from "../ui";

function DiverRow({ diver, actions }: { diver: Diver; actions: React.ReactNode }) {
  const source = mediaSource(diver.avatarUrl); const initials = `${diver.firstName?.[0] || diver.username[0] || "D"}${diver.lastName?.[0] || ""}`.toUpperCase();
  return <Card><View style={styles.row}><View style={styles.avatar}>{source ? <Image source={source} style={styles.avatarImage} /> : <Text style={styles.initials}>{initials}</Text>}</View><View style={styles.identity}><Text style={styles.name}>{diver.firstName ? `${diver.firstName} ${diver.lastName || ""}` : `@${diver.username}`}</Text><Text style={styles.handle}>@{diver.username} · {diver.publicId}</Text></View></View><View style={styles.actions}>{actions}</View></Card>;
}

export function FriendsScreen() {
  const { t } = useLanguage(); const navigation = useNavigation<any>(); const [data, setData] = useState<{ friends: Diver[]; incoming: Diver[]; outgoing: Diver[] }>({ friends: [], incoming: [], outgoing: [] }); const [query, setQuery] = useState(""); const [results, setResults] = useState<Diver[]>([]); const [refreshing, setRefreshing] = useState(false); const [message, setMessage] = useState("");
  const load = useCallback(async () => { try { setData(await api("/api/friends")); } finally { setRefreshing(false); } }, []); useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function search() { if (query.trim().length < 2) return; try { setResults((await api<{ divers: Diver[] }>(`/api/divers/search?q=${encodeURIComponent(query.trim())}`)).divers); } catch { setMessage(t("error")); } }
  async function respond(id: string, action: "accept" | "decline") { await api(`/api/friends/requests/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }); await load(); }
  async function connect(identifier: string) { try { await api("/api/friends/requests", { method: "POST", body: JSON.stringify({ identifier }) }); setMessage(t("created")); await load(); await search(); } catch { setMessage(t("error")); } }
  function remove(diver: Diver) { Alert.alert(t("remove"), t("confirmDelete"), [{ text: t("cancel"), style: "cancel" }, { text: t("remove"), style: "destructive", onPress: () => void api(`/api/friends/requests/${diver.friendshipId}`, { method: "DELETE" }).then(load) }]); }
  const view = (diver: Diver) => navigation.navigate("PublicProfile", { publicId: diver.publicId });
  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.aqua} />}>
    <Title title={t("friendsTitle")} subtitle={t("friendsSub")} /><Card><Field label={t("search")} value={query} onChangeText={setQuery} placeholder={`@${t("username")} / ${t("memberId")}`} autoCapitalize="none" /><Button title={t("search")} onPress={search} disabled={query.trim().length < 2} /></Card>
    {message ? <Notice text={message} error={message === t("error")} /> : null}
    {results.map((diver) => <DiverRow key={diver.publicId} diver={diver} actions={<><View style={styles.action}><Button title={t("viewProfile")} onPress={() => view(diver)} variant="secondary" compact /></View>{!diver.relationship ? <View style={styles.action}><Button title={t("connect")} onPress={() => void connect(diver.publicId)} compact /></View> : <Text style={styles.status}>{diver.relationship.status}</Text>}</>} />)}
    <SectionTitle count={data.incoming.length}>{t("requests")}</SectionTitle>{data.incoming.length ? data.incoming.map((diver) => <DiverRow key={diver.requestId} diver={diver} actions={<><View style={styles.action}><Button title={t("accept")} onPress={() => void respond(diver.requestId!, "accept")} compact /></View><View style={styles.action}><Button title={t("decline")} onPress={() => void respond(diver.requestId!, "decline")} variant="danger" compact /></View></>} />) : <Card><Text style={styles.empty}>{t("empty")}</Text></Card>}
    <SectionTitle count={data.friends.length}>{t("myFriends")}</SectionTitle>{data.friends.length ? data.friends.map((diver) => <DiverRow key={diver.friendshipId} diver={diver} actions={<><View style={styles.action}><Button title={t("viewProfile")} onPress={() => view(diver)} variant="secondary" compact /></View><View style={styles.action}><Button title={t("remove")} onPress={() => remove(diver)} variant="danger" compact /></View></>} />) : <Card><Text style={styles.empty}>{t("noFriends")}</Text></Card>}
    {data.outgoing.length ? <><SectionTitle count={data.outgoing.length}>{t("sent")}</SectionTitle>{data.outgoing.map((diver) => <DiverRow key={diver.requestId} diver={diver} actions={<Text style={styles.status}>{t("pending")}</Text>} />)}</> : null}
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 12, alignItems: "center" }, avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: 52, height: 52 }, initials: { color: "white", fontWeight: "900", fontSize: 18 }, identity: { flex: 1 }, name: { color: colors.text, fontWeight: "900", fontSize: 16 }, handle: { color: colors.muted, marginTop: 3, fontSize: 12 }, actions: { flexDirection: "row", gap: 8, alignItems: "center" }, action: { flex: 1 }, status: { color: colors.muted, fontWeight: "800" }, empty: { color: colors.muted, textAlign: "center" } });
