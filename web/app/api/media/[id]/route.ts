import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { areFriends } from "@/lib/social";
import { readMedia } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const viewerId = await sessionUserId();
  if (!viewerId) return apiError("UNAUTHENTICATED", 401);
  const { id } = await context.params;
  const media = await db.media.findUnique({
    where: { id },
    include: {
      owner: { select: { profileVisibility: true } },
      dive: { include: { user: { select: { logbookVisibility: true } } } },
      review: { select: { id: true } },
    },
  });
  if (!media) return apiError("NOT_FOUND", 404);

  let allowed = media.ownerId === viewerId || Boolean(media.review);
  if (media.dive) {
    allowed = allowed || (media.dive.visibility === "PUBLIC" && media.dive.user.logbookVisibility === "PUBLIC");
  } else if (media.kind === "AVATAR") {
    allowed = allowed || media.owner.profileVisibility === "PUBLIC" || (await areFriends(viewerId, media.ownerId));
  }
  if (!allowed) return apiError("NOT_FOUND", 404);

  try {
    const bytes = await readMedia(media.storageKey);
    const body = Uint8Array.from(bytes);
    return new Response(body.buffer, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return apiError("NOT_FOUND", 404);
  }
}
