import { describe, expect, it } from "vitest";
import { diveSchema, planSchema, reviewSchema } from "../lib/validation";

describe("diving feature validation", () => {
  it("accepts a complete dive with GPS and privacy", () => {
    const result = diveSchema.safeParse({
      date: "2026-08-09", siteName: "Blue Hole", depthM: 31.4,
      durationMinutes: 48, details: "Clear water", visibility: "PRIVATE",
      latitude: 28.5721, longitude: 34.5373, photoIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects partial or invalid GPS coordinates", () => {
    expect(diveSchema.safeParse({ date: "2026-08-09", siteName: "Reef", depthM: 20, durationMinutes: 40, latitude: 91, longitude: null }).success).toBe(false);
  });

  it("enforces ratings and accepts a date-only planning range", () => {
    expect(reviewSchema.safeParse({ siteName: "Reef", latitude: 10, longitude: 20, rating: 6 }).success).toBe(false);
    expect(planSchema.safeParse({ plannedFor: "2027-01-01", plannedUntil: "2027-01-08", siteName: "Reef", visibility: "PUBLIC", latitude: null, longitude: null }).success).toBe(true);
    expect(planSchema.safeParse({ plannedFor: "2027-01-08", plannedUntil: "2027-01-01", siteName: "Reef", visibility: "PUBLIC", latitude: null, longitude: null }).success).toBe(false);
  });

  it("requires either a canonical site or a named GPS position for a review", () => {
    expect(reviewSchema.safeParse({ siteId: "c792f9b6-48b2-4bc1-bd55-2ac35bcb9d75", rating: 5 }).success).toBe(true);
    expect(reviewSchema.safeParse({ siteName: "Calanque Reef", latitude: 43.21, longitude: 5.34, rating: 4 }).success).toBe(true);
    expect(reviewSchema.safeParse({ siteName: "Calanque Reef", rating: 4 }).success).toBe(false);
  });

  it("accepts grouped dives but limits the group size", () => {
    const base = { date: "2026-08-09", siteName: "Reef", depthM: 20, durationMinutes: 40 };
    const dive = diveSchema.safeParse({ ...base, groupCount: 10 });
    expect(dive.success).toBe(true);
    if (dive.success) expect(dive.data.visibility).toBe("PUBLIC");
    expect(diveSchema.safeParse({ ...base, groupCount: 101 }).success).toBe(false);
  });

  it("makes new planned dives public unless privacy is explicitly selected", () => {
    const plan = planSchema.safeParse({
      plannedFor: "2027-01-01", plannedUntil: "2027-01-08", siteName: "Reef",
      latitude: null, longitude: null,
    });
    expect(plan.success).toBe(true);
    if (plan.success) expect(plan.data.visibility).toBe("PUBLIC");
  });
});
