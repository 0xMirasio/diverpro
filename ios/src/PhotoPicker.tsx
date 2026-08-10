import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "./theme";
import { useLanguage } from "./i18n";

export function PhotoPicker({ uris, onChange, multiple = true }: { uris: string[]; onChange: (uris: string[]) => void; multiple?: boolean }) {
  const { t } = useLanguage();
  async function choose() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: multiple, selectionLimit: multiple ? Math.max(1, 6 - uris.length) : 1, quality: 0.75 });
    if (!result.canceled) onChange(multiple ? [...uris, ...result.assets.map((asset) => asset.uri)].slice(0, 6) : [result.assets[0]!.uri]);
  }
  return <View style={styles.wrapper}><Pressable style={styles.pick} onPress={choose}><Text style={styles.pickText}>＋ {t("choosePhotos")}</Text></Pressable>{uris.length ? <View style={styles.row}>{uris.map((uri) => <Pressable key={uri} onPress={() => onChange(uris.filter((item) => item !== uri))}><Image source={{ uri }} style={styles.image} /><Text style={styles.remove}>×</Text></Pressable>)}</View> : null}</View>;
}

const styles = StyleSheet.create({ wrapper: { gap: 10 }, pick: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.blue, borderRadius: 13, minHeight: 46, alignItems: "center", justifyContent: "center" }, pickText: { color: colors.blue, fontWeight: "800" }, row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, image: { width: 68, height: 68, borderRadius: 12 }, remove: { position: "absolute", top: -7, right: -5, color: "white", backgroundColor: colors.danger, width: 20, height: 20, borderRadius: 10, textAlign: "center", overflow: "hidden", fontWeight: "900" } });
