import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/user-identity";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_CREDENTIALS", 401);

  const user = await db.user.findUnique({
    where: { emailKey: normalizeEmail(parsed.data.email) },
  });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return apiError("INVALID_CREDENTIALS", 401);
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, publicId: user.publicId, username: user.username },
  });
}
