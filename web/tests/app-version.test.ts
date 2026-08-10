import { describe, expect, it } from "vitest";
import packageInfo from "../package.json";
import { APP_VERSION } from "../lib/app-version";

describe("WebApp version", () => {
  it("uses package.json as its single semantic-version source", () => {
    expect(APP_VERSION).toBe(packageInfo.version);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
