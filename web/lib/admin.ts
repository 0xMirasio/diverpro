import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function adminUser() {
  const id = await sessionUserId(); if (!id) return null;
  return db.user.findFirst({ where: { id, role: "ADMIN" }, select: { id: true, username: true } });
}
