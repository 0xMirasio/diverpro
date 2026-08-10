import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const endpoint = process.env.EMODNET_WFS_URL || "https://ows.emodnet-humanactivities.eu/wfs";
const pageSize = 2000;
const maxDepthM = Number(process.env.WRECK_MAX_DEPTH_M || 60);

function normalized(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function comparableName(value) {
  return normalized(value).replace(/^(the |wreck of |ss |s s |mv |m v |hms |h m s )+/, "").trim();
}

function similarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = new Set(left.split(" ")); const b = new Set(right.split(" "));
  const intersection = [...a].filter((part) => b.has(part)).length;
  return intersection / Math.max(a.size, b.size);
}

function distanceMeters(aLat, aLon, bLat, bLon) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function numberFrom(...values) {
  for (const value of values) {
    const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
    const number = match ? Number(match[0]) : NaN;
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function useful(value) {
  const text = String(value ?? "").trim();
  return text && !["n/a", "none reported", "unknown"].includes(text.toLowerCase()) ? text : null;
}

function metadataObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function bucketKey(latitude, longitude) {
  return `${Math.floor(latitude / 0.005)}:${Math.floor(longitude / 0.005)}`;
}

function nearbyCandidates(buckets, latitude, longitude) {
  const latCell = Math.floor(latitude / 0.005); const lonCell = Math.floor(longitude / 0.005); const candidates = [];
  for (let latOffset = -2; latOffset <= 2; latOffset += 1) for (let lonOffset = -2; lonOffset <= 2; lonOffset += 1) candidates.push(...(buckets.get(`${latCell + latOffset}:${lonCell + lonOffset}`) || []));
  return candidates;
}

async function fetchPage(startIndex) {
  const params = new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeName: "emodnet:wwshipwrecks",
    outputFormat: "application/json", srsName: "EPSG:4326", count: String(pageSize), startIndex: String(startIndex),
    sortBy: "wreck_id", CQL_FILTER: "name <> 'n/a' AND water_leve = 'always under water/submerged'",
    propertyName: "wreck_id,name,type,flag,water_dept,depth,date_sunk,wreck_cate,status,circumstan,general_co,the_geom",
  });
  const response = await fetch(`${endpoint}?${params}`, { signal: AbortSignal.timeout(90000), headers: { "User-Agent": "BlueMates global wreck importer" } });
  if (!response.ok) throw new Error(`EMODnet returned ${response.status} at index ${startIndex}`);
  return response.json();
}

function toSite(feature) {
  const properties = feature?.properties || {}; const coordinates = feature?.geometry?.coordinates || [];
  const longitude = Number(coordinates[0]); const latitude = Number(coordinates[1]);
  const wreckId = useful(properties.wreck_id); const name = useful(properties.name)?.slice(0, 160);
  const depth = numberFrom(properties.water_dept, properties.depth);
  if (!wreckId || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || depth == null || depth < 1 || depth > maxDepthM) return null;
  if (["unknown", "unnamed", "wreck"].includes(normalized(name))) return null;
  const vesselType = useful(properties.type); const category = useful(properties.wreck_cate); const sunk = useful(properties.date_sunk); const circumstances = useful(properties.circumstan); const condition = useful(properties.general_co);
  const summary = [vesselType, category, sunk ? `Sunk: ${sunk}` : null, circumstances, condition].filter(Boolean).join(" · ").slice(0, 3000) || null;
  return {
    name, normalizedName: normalized(name), latitude, longitude, sourceDescription: summary,
    source: "EMODNET_WRECK", externalId: `emodnet-wreck:${wreckId}`,
    sourceUrl: "https://emodnet.ec.europa.eu/en/extensive-wreck-data-set-now-available-emodnet",
    environment: "salt_water", topologies: ["wreck"], maxDepthM: depth,
    metadata: { emodnetWreck: { wreckId, vesselType, flag: useful(properties.flag), category, status: useful(properties.status), sunk, depthM: depth } },
  };
}

async function fetchCatalogue() {
  const catalogue = []; let startIndex = 0; let total = Infinity;
  while (startIndex < total) {
    const page = await fetchPage(startIndex);
    total = Number(page.numberMatched || 0);
    catalogue.push(...(page.features || []).map(toSite).filter(Boolean));
    startIndex += Number(page.numberReturned || page.features?.length || pageSize);
    if (!page.features?.length) break;
    console.log(`Fetched ${Math.min(startIndex, total)}/${total} EMODnet wreck records`);
  }
  return catalogue;
}

async function main() {
  const catalogue = await fetchCatalogue();
  const existing = await prisma.diveSite.findMany({ select: { id: true, name: true, normalizedName: true, latitude: true, longitude: true, source: true, sourceDescription: true, externalId: true, metadata: true, topologies: true, maxDepthM: true } });
  const byExternalId = new Map(existing.filter((site) => site.externalId).map((site) => [site.externalId, site]));
  const buckets = new Map();
  for (const site of existing) { const key = bucketKey(site.latitude, site.longitude); buckets.set(key, [...(buckets.get(key) || []), site]); }
  const operations = []; let created = 0; let updated = 0; let enriched = 0;

  for (const site of catalogue) {
    let match = byExternalId.get(site.externalId);
    if (!match) match = nearbyCandidates(buckets, site.latitude, site.longitude)
      .map((candidate) => ({ candidate, distance: distanceMeters(site.latitude, site.longitude, candidate.latitude, candidate.longitude), score: similarity(comparableName(site.name), comparableName(candidate.name)) }))
      .filter(({ distance, score }) => distance < 500 && (score === 1 || (distance < 200 && score >= 0.75)))
      .sort((left, right) => right.score - left.score || left.distance - right.distance)[0]?.candidate;

    if (match) {
      if (String(match.id).startsWith("pending-")) { enriched += 1; continue; }
      const previousMetadata = metadataObject(match.metadata); const previousTopologies = Array.isArray(match.topologies) ? match.topologies : [];
      operations.push(prisma.diveSite.update({ where: { id: match.id }, data: {
        sourceDescription: match.source === "EMODNET_WRECK" ? site.sourceDescription : match.sourceDescription || site.sourceDescription,
        topologies: [...new Set([...previousTopologies, "wreck"])], maxDepthM: match.maxDepthM ?? site.maxDepthM,
        metadata: { ...previousMetadata, ...site.metadata },
        ...(match.externalId === site.externalId ? { name: site.name, normalizedName: site.normalizedName, latitude: site.latitude, longitude: site.longitude, sourceUrl: site.sourceUrl } : {}),
      } }));
      updated += 1; if (match.externalId !== site.externalId) enriched += 1;
    } else {
      operations.push(prisma.diveSite.create({ data: site }));
      const createdSite = { ...site, id: `pending-${created}`, sourceDescription: site.sourceDescription, metadata: site.metadata, topologies: site.topologies, maxDepthM: site.maxDepthM };
      byExternalId.set(site.externalId, createdSite); const key = bucketKey(site.latitude, site.longitude); buckets.set(key, [...(buckets.get(key) || []), createdSite]); created += 1;
    }
  }

  for (let index = 0; index < operations.length; index += 100) await prisma.$transaction(operations.slice(index, index + 100));
  console.log(JSON.stringify({ scanned: catalogue.length, created, updated, enrichedExistingSites: enriched, maximumDepthM: maxDepthM, source: "EMODnet / UK Hydrographic Office", license: "Open Government Licence" }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
