import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { planSchema } from "@/lib/validation";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const plans = await db.plannedDive.findMany({ where: { userId, plannedUntil: { gte: today } }, orderBy: { plannedFor: "asc" } });
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return apiError("UNAUTHENTICATED", 401);
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400, parsed.error.flatten());
  const { plannedFor: startDate, plannedUntil: endDate, ...input } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today || endDate < startDate) return apiError("INVALID_DATE_RANGE", 400);
  const plannedFor = new Date(`${startDate}T12:00:00.000Z`);
  const plannedUntil = new Date(`${endDate}T12:00:00.000Z`);
  const plan = await db.plannedDive.create({
    data: {
      ...input,
      plannedFor,
      plannedUntil,
      details: input.details || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      userId,
    },
  });
  return NextResponse.json({ plan }, { status: 201 });
}
