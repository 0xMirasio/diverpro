import { cookies } from "next/headers";
import { headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const SESSION_COOKIE = "bluemates_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const MOBILE_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false";
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function createAccessToken(userId: string, durationSeconds = SESSION_DURATION_SECONDS) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${durationSeconds}s`)
    .sign(secret());
}

export async function createMobileAccessToken(userId: string) {
  return createAccessToken(userId, MOBILE_SESSION_DURATION_SECONDS);
}

export async function createSession(userId: string) {
  const token = await createAccessToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
}

export async function sessionUserId() {
  const authorization = (await headers()).get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const token = bearerToken || (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function currentUser() {
  const id = await sessionUserId();
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      publicId: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      role: true,
      locale: true,
      birthDate: true,
      bio: true,
      avatarUrl: true,
      profileVisibility: true,
      logbookVisibility: true,
    },
  });
}
