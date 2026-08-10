type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  osm_key?: string;
  osm_value?: string;
  osm_type?: string;
  osm_id?: number;
};

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: unknown[] };
  properties?: PhotonProperties;
};

type PhotonResponse = { features?: PhotonFeature[] };

export type PlaceResult = {
  id: string;
  name: string;
  label: string;
  context: string;
  type: string;
  latitude: number;
  longitude: number;
};

const cache = new Map<string, { expiresAt: number; results: PlaceResult[] }>();
const cacheTtlMs = 10 * 60 * 1000;

function compactUnique(values: Array<string | undefined>) {
  return values.filter((value, index, all): value is string => Boolean(value?.trim()) && all.indexOf(value) === index);
}

function normalizeFeature(feature: PhotonFeature, index: number): PlaceResult | null {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties ?? {};
  const longitude = Number(coordinates?.[0]);
  const latitude = Number(coordinates?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const street = compactUnique([properties.housenumber, properties.street]).join(" ");
  const name = properties.name || street || properties.city || properties.country || "Selected place";
  const contextParts = compactUnique([
    street && street !== name ? street : undefined,
    properties.postcode,
    properties.city && properties.city !== name ? properties.city : undefined,
    properties.district,
    properties.state,
    properties.country,
  ]);
  const context = contextParts.join(", ");
  return {
    id: properties.osm_type && properties.osm_id ? `${properties.osm_type}-${properties.osm_id}` : `${longitude}-${latitude}-${index}`,
    name,
    label: compactUnique([name, context]).join(", "),
    context,
    type: properties.osm_value || properties.osm_key || "place",
    latitude,
    longitude,
  };
}

export async function geocode(path: "api" | "reverse", params: URLSearchParams) {
  const baseUrl = process.env.GEOCODER_URL || "https://photon.komoot.io";
  const url = new URL(`/${path}`, baseUrl);
  params.forEach((value, key) => url.searchParams.append(key, value));
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const response = await fetch(url, {
    headers: { Accept: "application/geo+json, application/json", "User-Agent": "BlueMates/1.0 geocoding-proxy" },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
  const data = (await response.json()) as PhotonResponse;
  const results = (data.features ?? []).map(normalizeFeature).filter((place): place is PlaceResult => place !== null);
  cache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, results });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return results;
}
