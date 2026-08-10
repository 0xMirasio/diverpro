import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { geocode } from "@/lib/geocoding";

export async function GET(request: Request) {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const query = new URL(request.url).searchParams;
  const q = query.get("q")?.trim() ?? "";
  const lang = query.get("lang") ?? "en";
  if (q.length < 3 || q.length > 120 || !["en", "fr", "es"].includes(lang)) return apiError("INVALID_INPUT", 400);
  const params = new URLSearchParams({ q, lang, limit: "7" });
  const lat = Number(query.get("lat")); const lon = Number(query.get("lon"));
  if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180) {
    params.set("lat", String(lat)); params.set("lon", String(lon)); params.set("location_bias_scale", "0.25");
  }
  try { return NextResponse.json({ places: await geocode("api", params) }); }
  catch (error) { console.error("geocoding_search_failed", error); return apiError("GEOCODER_UNAVAILABLE", 502); }
}
