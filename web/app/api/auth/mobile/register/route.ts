import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createMobileAccessToken } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  normalizeEmail,
  normalizeUsername,
  publicIdBase,
  publicIdCandidate,
} from "@/lib/user-identity";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());

  const input = parsed.data;
  const usernameKey = normalizeUsername(input.username);
  const emailKey = normalizeEmail(input.email);
  const passwordHash = await hash(input.password, 12);
  const base = publicIdBase(input.firstName, input.lastName);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const user = await db.user.create({
        data: {
          publicId: publicIdCandidate(base, attempt),
          firstName: input.firstName,
          lastName: input.lastName,
          username: input.username,
          usernameKey,
          email: input.email.trim(),
          emailKey,
          passwordHash,
          locale: input.locale,
        },
        select: { id: true, publicId: true, username: true },
      });
      return NextResponse.json({
        accessToken: await createMobileAccessToken(user.id),
        user,
      }, { status: 201 });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        console.error("mobile_registration_failed", error);
        return apiError("REGISTRATION_FAILED", 500);
      }

      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");
      if (target.includes("username_key")) return apiError("USERNAME_TAKEN", 409);
      if (target.includes("email_key")) return apiError("EMAIL_TAKEN", 409);
      if (!target.includes("public_id")) return apiError("REGISTRATION_FAILED", 500);
    }
  }

  return apiError("PUBLIC_ID_UNAVAILABLE", 409);
}
