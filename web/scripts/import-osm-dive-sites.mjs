import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const endpoint = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const query = `[out:json][timeout:120];nwr["sport"="scuba_diving"]["scuba_diving:divespot"]["name"];out center tags;`;

function normalized(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function distanceMeters(aLat, aLon, bLat, bLon) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function description(tags) {
  return tags.description || tags["description:en"] || tags["description:fr"] || tags["description:es"] || null;
}

async function reconcileLegacyReviews() {
  const [reviews, existingSites] = await Promise.all([
    prisma.siteReview.findMany({ where: { siteId: null }, select: { id: true, userId: true, siteName: true, latitude: true, longitude: true } }),
    prisma.diveSite.findMany({ select: { id: true, name: true, latitude: true, longitude: true } }),
  ]);
  let linked = 0; let created = 0;
  for (const review of reviews) {
    let site = existingSites
      .map((candidate) => ({ ...candidate, distance: distanceMeters(review.latitude, review.longitude, candidate.latitude, candidate.longitude) }))
      .filter((candidate) => candidate.distance < 500)
      .sort((left, right) => left.distance - right.distance)[0];
    if (!site) {
      site = await prisma.$transaction(async (tx) => {
        const canonical = await tx.diveSite.create({ data: { name: review.siteName, normalizedName: normalized(review.siteName), latitude: review.latitude, longitude: review.longitude, source: "COMMUNITY", createdById: review.userId } });
        await tx.siteChangeLog.create({ data: { siteId: canonical.id, actorId: review.userId, action: "SITE_CREATED", after: { name: canonical.name, latitude: canonical.latitude, longitude: canonical.longitude, reconciledReviewId: review.id } } });
        return canonical;
      });
      existingSites.push(site); created += 1;
    }
    await prisma.siteReview.update({ where: { id: review.id }, data: { siteId: site.id, siteName: site.name, latitude: site.latitude, longitude: site.longitude } });
    linked += 1;
  }
  return { linked, created };
}

async function main() {
  const body = new URLSearchParams({ data: query });
  const response = await fetch(endpoint, { method: "POST", body, signal: AbortSignal.timeout(180000), headers: { "User-Agent": "BlueMates dive-site importer" } });
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
  const reconciledReviews = await reconcileLegacyReviews();
  console.log(JSON.stringify({ imported: sites.length, reconciledReviews, source: "OpenStreetMap contributors", license: "ODbL 1.0", timestamp: payload.osm3s?.timestamp_osm_base || null }));
}

main().finally(() => prisma.$disconnect());
