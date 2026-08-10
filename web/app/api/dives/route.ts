import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { diveSchema } from "@/lib/validation";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const [user, dives] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { logbookVisibility: true } }),
    db.dive.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { photos: { select: { id: true } } },
    }),
  ]);
  return NextResponse.json({ logbookVisibility: user?.logbookVisibility, dives });
}

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const parsed = diveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());
  const { photoIds, date, ...input } = parsed.data;

  const dive = await db.$transaction(async (tx) => {
    const created = await tx.dive.create({
      data: {
        ...input,
        date: new Date(`${date}T12:00:00.000Z`),
        details: input.details || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        userId,
      },
    });
    if (photoIds.length) {
      const result = await tx.media.updateMany({
        where: { id: { in: photoIds }, ownerId: userId, kind: "DIVE", diveId: null },
        data: { diveId: created.id },
      });
      if (result.count !== photoIds.length) throw new Error("INVALID_MEDIA");
    }
    return created;
  }).catch((error) => {
    console.error("create_dive_failed", error);
    return null;
  });
  if (!dive) return apiError("CREATE_FAILED", 400);
  return NextResponse.json({ dive }, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const body = await request.json().catch(() => null) as { logbookVisibility?: unknown } | null;
  if (body?.logbookVisibility !== "PUBLIC" && body?.logbookVisibility !== "PRIVATE") return apiError("INVALID_INPUT", 400);
  await db.user.update({ where: { id: userId }, data: { logbookVisibility: body.logbookVisibility } });
  return NextResponse.json({ ok: true });
}
