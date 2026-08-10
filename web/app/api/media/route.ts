import { MediaKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptedImageTypes, maxAvatarImageBytes, maxImageBytes, mediaStorageKey, saveMedia } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const form = await request.formData();
  const file = form.get("file");
  const kindValue = form.get("kind");
  if (!(file instanceof File) || typeof kindValue !== "string" || !(kindValue in MediaKind)) {
    return apiError("INVALID_UPLOAD", 400);
  }
  const kind = kindValue as MediaKind;
  const byteLimit = kind === "AVATAR" ? maxAvatarImageBytes : maxImageBytes;
  if (!acceptedImageTypes.includes(file.type) || file.size <= 0 || file.size > byteLimit) {
    return apiError("INVALID_IMAGE", 400);
  }
  const storageKey = mediaStorageKey(userId, file.type);
  await saveMedia(storageKey, new Uint8Array(await file.arrayBuffer()));
  const media = await db.media.create({
    data: { ownerId: userId, storageKey, mimeType: file.type, byteSize: file.size, kind },
    select: { id: true },
  });
  return NextResponse.json({ media: { id: media.id, url: `/api/media/${media.id}` } }, { status: 201 });
}
