import { db } from "./db";

export function normalizeSiteName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function nameSimilarity(left: string, right: string) {
  const a = normalizeSiteName(left); const b = normalizeSiteName(right);
  if (!a || !b) return 0; if (a === b) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]; previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

export async function siteCandidates(name: string, latitude?: number | null, longitude?: number | null, limit = 8) {
  const sites = await db.diveSite.findMany({
    select: { id: true, name: true, latitude: true, longitude: true, description: true, sourceDescription: true, source: true, _count: { select: { reviews: true } } },
    take: 5000,
  });
  return sites.map(({ _count, ...site }) => {
    const distance = latitude != null && longitude != null ? distanceMeters(latitude, longitude, site.latitude, site.longitude) : null;
    const similarity = nameSimilarity(name, site.name);
    return { ...site, description: site.description || site.sourceDescription, distanceMeters: distance == null ? null : Math.round(distance), nameSimilarity: Number(similarity.toFixed(3)), reviewCount: _count.reviews };
  }).filter((site) => (site.distanceMeters != null && site.distanceMeters < 500) || site.nameSimilarity >= 0.72)
    .sort((a, b) => Number(b.nameSimilarity >= 0.72) - Number(a.nameSimilarity >= 0.72) || (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity) || b.nameSimilarity - a.nameSimilarity)
    .slice(0, limit);
}
