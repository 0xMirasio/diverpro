import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { adminUser } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!(await adminUser())) return apiError("FORBIDDEN", 403);
  const query = (new URL(request.url).searchParams.get("q") || "").trim();
  const [sites, logs] = await Promise.all([
    db.diveSite.findMany({ where: query ? { name: { contains: query, mode: "insensitive" } } : undefined, include: { _count: { select: { reviews: true } } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    db.siteChangeLog.findMany({ include: { actor: { select: { username: true } }, site: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return NextResponse.json({ sites: sites.map(({ _count, ...site }) => ({ ...site, reviewCount: _count.reviews })), logs });
}
