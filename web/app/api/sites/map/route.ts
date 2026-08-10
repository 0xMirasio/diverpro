import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await sessionUserId())) return apiError("UNAUTHENTICATED", 401);
  const sites = await db.diveSite.findMany({
    select: {
      id: true, name: true, latitude: true, longitude: true, description: true, sourceDescription: true,
      source: true, countryName: true, seaName: true, environment: true, topologies: true, maxDepthM: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    points: sites.map((site) => ({
      id: site.id, type: "site", source: "community", siteName: site.name,
      latitude: site.latitude, longitude: site.longitude,
      description: site.description || site.sourceDescription, reviewCount: site._count.reviews,
      siteSource: site.source, href: `/sites/${site.id}`,
      locationLabel: [site.seaName, site.countryName].filter(Boolean).join(" · ") || null,
      environment: site.environment, topologies: site.topologies, maxDepthM: site.maxDepthM,
    })),
  }, { headers: { "Cache-Control": "private, max-age=300" } });
}
