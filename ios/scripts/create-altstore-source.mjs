import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, "..");
const [ipaPath, infoPath, outputPath] = process.argv.slice(2);
if (!ipaPath || !infoPath || !outputPath) throw new Error("Usage: create-altstore-source <ipa> <Info.json> <output>");

const [pkg, config, info, ipa, ipaStats] = await Promise.all([
  readFile(path.join(project, "package.json"), "utf8").then(JSON.parse),
  readFile(path.join(project, "app.json"), "utf8").then(JSON.parse),
  readFile(infoPath, "utf8").then(JSON.parse),
  readFile(ipaPath),
  stat(ipaPath),
]);

const privacy = Object.fromEntries(Object.entries(info).filter(([key, value]) => /^NS.*UsageDescription$/.test(key) && typeof value === "string"));
const releaseUrl = "https://github.com/0xMirasio/diverpro/releases/download/ios-latest/BlueMates.ipa";
const website = "https://bluemates.duckdns.org";
const iconUrl = `${website}/images/bluemates-turtle-logo.webp`;
const source = {
  name: "BlueMates",
  identifier: "org.bluemates.source",
  subtitle: "The BlueMates community app for divers.",
  description: "Log dives, plan trips, connect with divers and explore dive sites from iOS.",
  iconURL: iconUrl,
  website,
  tintColor: "#0879AD",
  featuredApps: [config.expo.ios.bundleIdentifier],
  apps: [{
    name: config.expo.name,
    bundleIdentifier: config.expo.ios.bundleIdentifier,
    developerName: "BlueMates",
    subtitle: "Your diving life, everywhere.",
    localizedDescription: "A complete companion for digital dive logs, future dive planning, friends, dive-site reviews, photos and an interactive worldwide map.",
    iconURL: iconUrl,
    tintColor: "#0879AD",
    category: "lifestyle",
    versions: [{
      version: pkg.version,
      buildVersion: config.expo.ios.buildNumber,
      date: new Date().toISOString().slice(0, 10),
      localizedDescription: "Initial BlueMates iOS release.",
      downloadURL: releaseUrl,
      size: ipaStats.size,
      sha256: createHash("sha256").update(ipa).digest("hex"),
      minOSVersion: "16.4",
    }],
    appPermissions: { entitlements: [], privacy },
  }],
  news: [],
};

await writeFile(outputPath, `${JSON.stringify(source, null, 2)}\n`);
