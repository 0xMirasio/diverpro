import React from "react";
import { useNavigation } from "@react-navigation/native";
import { MapPanel } from "../MapPanel";
import { useLanguage } from "../i18n";
import { Card, Screen, Title } from "../ui";

export function MapScreen() {
  const { t } = useLanguage(); const navigation = useNavigation<any>();
  return <Screen><Title title={t("mapTitle")} subtitle={t("mapSub")} /><Card><MapPanel height={570} onSite={(siteId) => navigation.navigate("SiteDetail", { siteId })} /></Card></Screen>;
}
