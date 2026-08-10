import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { adminUser } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!(await adminUser())) return apiError("FORBIDDEN", 403);
  const query = (new URL(request.url).searchParams.get("q") || "").trim();
  const users = await db.user.findMany({
    where: query ? { OR: [
      { username: { contains: query, mode: "insensitive" } },
      { publicId: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
    ] } : undefined,
    select: {
      id: true, publicId: true, username: true, firstName: true, lastName: true, email: true,
      avatarUrl: true, role: true, locale: true, profileVisibility: true, logbookVisibility: true,
      birthDate: true, createdAt: true, updatedAt: true,
      _count: { select: { dives: true, plannedDives: true, reviews: true, sentFriendships: true, receivedFriendships: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ users });
}
