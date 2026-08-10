import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const endpoint = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const query = `[out:json][timeout:120];nwr["sport"="scuba_diving"]["scuba_diving:divespot"]["name"];out center tags;`;

function normalized(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function description(tags) {
  return tags.description || tags["description:en"] || tags["description:fr"] || tags["description:es"] || null;
}

async function main() {
  const body = new URLSearchParams({ data: query });
  const response = await fetch(endpoint, { method: "POST", body, signal: AbortSignal.timeout(180000), headers: { "User-Agent": "BlueMates/2.0 OSM dive-site importer" } });
  if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
  const payload = await response.json();
  const sites = (payload.elements || []).map((element) => {
    const latitude = element.lat ?? element.center?.lat; const longitude = element.lon ?? element.center?.lon;
    const name = String(element.tags?.name || "").trim().slice(0, 160);
    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const externalId = `osm:${element.type}:${element.id}`;
    const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
    return { name, normalizedName: normalized(name), latitude, longitude, sourceDescription: description(element.tags || {}), source: "OSM", externalId, sourceUrl, metadata: element.tags || {} };
  }).filter(Boolean);

  for (let index = 0; index < sites.length; index += 100) {
    const chunk = sites.slice(index, index + 100);
    await prisma.$transaction(chunk.map((site) => prisma.diveSite.upsert({
      where: { externalId: site.externalId },
      create: site,
      update: { name: site.name, normalizedName: site.normalizedName, latitude: site.latitude, longitude: site.longitude, sourceDescription: site.sourceDescription, sourceUrl: site.sourceUrl, metadata: site.metadata },
    })));
  }
  console.log(JSON.stringify({ imported: sites.length, source: "OpenStreetMap contributors", license: "ODbL 1.0", timestamp: payload.osm3s?.timestamp_osm_base || null }));
}

main().finally(() => prisma.$disconnect());
