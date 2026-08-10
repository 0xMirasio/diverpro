import { NextResponse } from "next/server";

export function apiError(code: string, status: number, details?: unknown) {
  return NextResponse.json({ error: code, details }, { status });
}
