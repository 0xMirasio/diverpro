import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("UNAUTHENTICATED", 401);
  return NextResponse.json({ user });
}
