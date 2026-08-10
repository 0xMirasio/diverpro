import { describe, expect, it } from "vitest";
import { distanceMeters, nameSimilarity, normalizeSiteName } from "../lib/dive-sites";
import { maxAvatarImageBytes, maxImageBytes } from "../lib/storage";

describe("dive-site matching", () => {
  it("normalizes accents and punctuation", () => {
    expect(normalizeSiteName("Épave du Chaouën")).toBe("epave du chaouen");
  });

  it("detects nearby coordinates within 500 metres", () => {
    expect(distanceMeters(43.2965, 5.3698, 43.299, 5.3698)).toBeLessThan(500);
    expect(distanceMeters(43.2965, 5.3698, 43.306, 5.3698)).toBeGreaterThan(500);
  });

  it("recognizes similar site names", () => {
    expect(nameSimilarity("Blue Hole Gozo", "Blue-Hole, Gozo")).toBe(1);
    expect(nameSimilarity("Blue Hole Gozo", "Manta Point")).toBeLessThan(0.5);
  });

  it("limits profile pictures to 300 KB without reducing dive photos", () => {
    expect(maxAvatarImageBytes).toBe(300 * 1024);
    expect(maxImageBytes).toBe(5 * 1024 * 1024);
  });
});
