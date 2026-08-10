import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const reviews = await db.siteReview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { photos: { select: { id: true } } },
  });
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());
  const { photoIds, ...input } = parsed.data;
  const review = await db.$transaction(async (tx) => {
    const created = await tx.siteReview.create({ data: { ...input, comment: input.comment || null, userId } });
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
