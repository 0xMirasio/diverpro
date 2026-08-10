import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeUsername, publicIdBase, publicIdCandidate } from "../lib/user-identity";

describe("user identity", () => {
  it("creates accent-free public IDs from names", () => {
    expect(publicIdBase("Élodie", "Díaz Martin")).toBe("elodie-diaz-martin");
  });

  it("adds a stable numeric suffix after a collision", () => {
    expect(publicIdCandidate("sam-lee", 0)).toBe("sam-lee");
    expect(publicIdCandidate("sam-lee", 1)).toBe("sam-lee-2");
    expect(publicIdCandidate("sam-lee", 9)).toBe("sam-lee-10");
  });

  it("normalizes unique login keys", () => {
    expect(normalizeEmail("  DIVER@Example.COM ")).toBe("diver@example.com");
    expect(normalizeUsername(" Aqua.Diver ")).toBe("aqua.diver");
  });
});
