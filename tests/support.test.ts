import { describe, expect, it } from "vitest";
import { INTERNATIONAL_DIRECTORY, SUPPORT_RESOURCES, countryFromLanguages } from "@/features/support/resources";

describe("support resources (spec 23, C-33)", () => {
  it("reads the country from the device's language settings only", () => {
    expect(countryFromLanguages(["en-IN"])).toBe("IN");
    expect(countryFromLanguages(["hi-IN", "en-US"])).toBe("IN");
    expect(countryFromLanguages(["zh-Hant-TW"])).toBe("TW");
    expect(countryFromLanguages(["en"])).toBeNull();
  });

  it("has India as the first configured country", () => {
    expect(SUPPORT_RESOURCES.IN).toBeDefined();
    expect(SUPPORT_RESOURCES.IN.emergency.number).toBe("112");
  });

  it("records a source and verification date for every entry", () => {
    for (const country of Object.values(SUPPORT_RESOURCES)) {
      expect(country.emergency.source).toMatch(/^https:\/\//);
      expect(country.emergency.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const r of country.resources) {
        expect(r.source).toMatch(/https:\/\//);
        expect(r.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (r.phone) expect(r.phone).toMatch(/^\+?\d+$/);
      }
    }
    expect(INTERNATIONAL_DIRECTORY.url).toMatch(/^https:\/\//);
  });
});
