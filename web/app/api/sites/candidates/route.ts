import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { siteCandidates } from "@/lib/dive-sites";

export async function GET(request: Request) {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const params = new URL(request.url).searchParams;
  const name = (params.get("name") || "").trim().slice(0, 160);
  const latitude = params.has("lat") ? Number(params.get("lat")) : null;
  const longitude = params.has("lon") ? Number(params.get("lon")) : null;
  if (name.length < 2 || (latitude != null && !Number.isFinite(latitude)) || (longitude != null && !Number.isFinite(longitude))) return apiError("INVALID_INPUT", 400);
  return NextResponse.json({ sites: await siteCandidates(name, latitude, longitude) });
}
