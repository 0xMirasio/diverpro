import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUsername } from "@/lib/user-identity";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());
  const { avatarMediaId, birthDate, ...input } = parsed.data;
  if (birthDate && new Date(birthDate) > new Date()) return apiError("INVALID_BIRTH_DATE", 400);

  let avatarUrl: string | undefined;
  if (avatarMediaId) {
    const media = await db.media.findFirst({ where: { id: avatarMediaId, ownerId: userId, kind: "AVATAR" } });
    if (!media) return apiError("INVALID_MEDIA", 400);
    avatarUrl = `/api/media/${media.id}`;
  }

  try {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...input,
        usernameKey: normalizeUsername(input.username),
        birthDate: birthDate ? new Date(`${birthDate}T12:00:00.000Z`) : null,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      select: { publicId: true, username: true, avatarUrl: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("USERNAME_TAKEN", 409);
    }
    console.error("update_profile_failed", error);
    return apiError("UPDATE_FAILED", 500);
  }
}
