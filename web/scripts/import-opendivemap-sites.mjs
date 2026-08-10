import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const endpoint = process.env.OPEN_DIVEMAP_URL || "https://api.opendivemap.com/v1";
const pageSize = 1000;

function normalized(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function distanceMeters(aLat, aLon, bLat, bLon) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function similarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = new Set(left.split(" ")); const b = new Set(right.split(" "));
  const intersection = [...a].filter((part) => b.has(part)).length;
  return intersection / Math.max(a.size, b.size);
}

function metadataObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function fetchCatalogue() {
  const firstResponse = await fetch(`${endpoint}/sites?limit=${pageSize}&offset=0`, { signal: AbortSignal.timeout(60000), headers: { "User-Agent": "BlueMates dive-site importer" } });
  if (!firstResponse.ok) throw new Error(`OpenDiveMap returned ${firstResponse.status}`);
  const first = await firstResponse.json();
  const total = Number(first.numberMatched || first.features?.length || 0);
  const offsets = [];
  for (let offset = pageSize; offset < total; offset += pageSize) offsets.push(offset);
  const pages = await Promise.all(offsets.map(async (offset) => {
    const response = await fetch(`${endpoint}/sites?limit=${pageSize}&offset=${offset}`, { signal: AbortSignal.timeout(60000), headers: { "User-Agent": "BlueMates dive-site importer" } });
    if (!response.ok) throw new Error(`OpenDiveMap returned ${response.status} at offset ${offset}`);
    return response.json();
  }));
  return [first, ...pages].flatMap((page) => page.features || []);
}

function toSite(feature) {
  const properties = feature?.properties || {}; const coordinates = feature?.geometry?.coordinates || [];
  const longitude = Number(coordinates[0]); const latitude = Number(coordinates[1]);
  const id = String(properties.id || "").trim(); const name = String(properties.name || "").trim().slice(0, 160);
  if (!id || !name || feature?.geometry?.type !== "Point" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const tags = metadataObject(properties.tags);
  return {
    name,
    normalizedName: normalized(name),
    latitude,
    longitude,
    sourceDescription: typeof tags.description === "string" ? tags.description : null,
    source: "OPEN_DIVEMAP",
    externalId: `opendivemap:${id}`,
    sourceUrl: `${endpoint}/sites/${id}`,
    countryCode: typeof properties.country_code === "string" ? properties.country_code.slice(0, 2) : null,
    countryName: typeof properties.country_name === "string" ? properties.country_name.slice(0, 120) : null,
    seaName: typeof properties.sea_name === "string" ? properties.sea_name.slice(0, 160) : null,
    environment: typeof properties.environment === "string" ? properties.environment.slice(0, 40) : null,
    topologies: Array.isArray(properties.topologies) ? properties.topologies : [],
    maxDepthM: Number.isFinite(properties.max_depth) ? Number(properties.max_depth) : null,
    entryType: typeof properties.entry === "string" ? properties.entry.slice(0, 40) : null,
    metadata: { openDiveMap: { id, tags, seaMrgid: properties.sea_mrgid ?? null } },
  };
}

async function main() {
  const catalogue = (await fetchCatalogue()).map(toSite).filter(Boolean);
  const existing = await prisma.diveSite.findMany({
    select: { id: true, name: true, normalizedName: true, latitude: true, longitude: true, sourceDescription: true, metadata: true, externalId: true },
  });
  const byExternalId = new Map(existing.filter((site) => site.externalId).map((site) => [site.externalId, site]));
  const operations = []; let created = 0; let updated = 0; let enriched = 0;

  for (const site of catalogue) {
    let match = byExternalId.get(site.externalId);
    if (!match) {
      match = existing
        .map((candidate) => ({ candidate, distance: distanceMeters(site.latitude, site.longitude, candidate.latitude, candidate.longitude), score: similarity(site.normalizedName, candidate.normalizedName) }))
        .filter(({ distance, score, candidate }) => candidate.externalId !== site.externalId && distance < 500 && (score === 1 || (distance < 200 && score >= 0.8)))
        .sort((left, right) => right.score - left.score || left.distance - right.distance)[0]?.candidate;
    }

    if (match) {
      const previousMetadata = metadataObject(match.metadata);
      operations.push(prisma.diveSite.update({ where: { id: match.id }, data: {
        sourceDescription: match.sourceDescription || site.sourceDescription,
        countryCode: site.countryCode,
        countryName: site.countryName,
        seaName: site.seaName,
        environment: site.environment,
        topologies: site.topologies,
        maxDepthM: site.maxDepthM,
        entryType: site.entryType,
        metadata: { ...previousMetadata, ...site.metadata },
        ...(match.externalId === site.externalId ? { name: site.name, normalizedName: site.normalizedName, latitude: site.latitude, longitude: site.longitude, sourceUrl: site.sourceUrl } : {}),
      } }));
      match.metadata = { ...previousMetadata, ...site.metadata }; updated += 1;
      if (match.externalId !== site.externalId) enriched += 1;
    } else {
      operations.push(prisma.diveSite.create({ data: site }));
      byExternalId.set(site.externalId, { ...site, id: null });
      created += 1;
    }
  }

  for (let index = 0; index < operations.length; index += 100) await prisma.$transaction(operations.slice(index, index + 100));
  console.log(JSON.stringify({ imported: catalogue.length, created, updated, enrichedExistingSites: enriched, source: "OpenDiveMap contributors", license: "ODbL 1.0" }));
}

main().finally(() => prisma.$disconnect());
