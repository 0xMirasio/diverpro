import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeSiteName, siteCandidates } from "@/lib/dive-sites";
import { reviewSchema } from "@/lib/validation";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const reviews = await db.siteReview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { photos: { select: { id: true } }, site: { select: { id: true, name: true, description: true, sourceDescription: true } } },
  });
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());
  const { photoIds, siteId, siteName, latitude, longitude, confirmNewSite, ...input } = parsed.data;
  let selectedSite = siteId ? await db.diveSite.findUnique({ where: { id: siteId } }) : null;
  if (siteId && !selectedSite) return apiError("SITE_NOT_FOUND", 404);
  if (!selectedSite && siteName && latitude != null && longitude != null) {
    const candidates = await siteCandidates(siteName, latitude, longitude);
    if (candidates.length && !confirmNewSite) return NextResponse.json({ error: "POSSIBLE_DUPLICATE", sites: candidates }, { status: 409 });
  }
  const review = await db.$transaction(async (tx) => {
    if (!selectedSite) {
      selectedSite = await tx.diveSite.create({ data: { name: siteName!, normalizedName: normalizeSiteName(siteName!), latitude: latitude!, longitude: longitude!, source: "COMMUNITY", createdById: userId } });
      await tx.siteChangeLog.create({ data: { siteId: selectedSite.id, actorId: userId, action: "SITE_CREATED", after: { name: selectedSite.name, latitude: selectedSite.latitude, longitude: selectedSite.longitude } } });
    }
    const created = await tx.siteReview.create({ data: { ...input, siteId: selectedSite.id, siteName: selectedSite.name, latitude: selectedSite.latitude, longitude: selectedSite.longitude, comment: input.comment || null, userId } });
    if (photoIds.length) {
      const result = await tx.media.updateMany({
        where: { id: { in: photoIds }, ownerId: userId, kind: "REVIEW", reviewId: null },
        data: { reviewId: created.id },
      });
      if (result.count !== photoIds.length) throw new Error("INVALID_MEDIA");
    }
    return created;
  }).catch((error) => {
    console.error("create_review_failed", error);
    return null;
  });
  if (!review) return apiError("CREATE_FAILED", 400);
  return NextResponse.json({ review }, { status: 201 });
}
