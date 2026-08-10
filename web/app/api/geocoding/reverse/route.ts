import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { geocode } from "@/lib/geocoding";

export async function GET(request: Request) {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const query = new URL(request.url).searchParams;
  const latitude = Number(query.get("lat")); const longitude = Number(query.get("lon")); const lang = query.get("lang") ?? "en";
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !["en", "fr", "es"].includes(lang)) return apiError("INVALID_INPUT", 400);
  try {
    const places = await geocode("reverse", new URLSearchParams({ lat: String(latitude), lon: String(longitude), lang, limit: "1" }));
    return NextResponse.json({ place: places[0] ?? null });
  } catch (error) { console.error("geocoding_reverse_failed", error); return apiError("GEOCODER_UNAVAILABLE", 502); }
}
