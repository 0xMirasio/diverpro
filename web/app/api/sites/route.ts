import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const params = new URL(request.url).searchParams; const query = (params.get("q") || "").trim();
  const sites = await db.diveSite.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    select: { id: true, name: true, latitude: true, longitude: true, description: true, sourceDescription: true, source: true, _count: { select: { reviews: true } } },
    orderBy: { name: "asc" }, take: query ? 50 : 5000,
  });
  return NextResponse.json({ sites: sites.map(({ _count, ...site }) => ({ ...site, description: site.description || site.sourceDescription, reviewCount: _count.reviews })) });
}
