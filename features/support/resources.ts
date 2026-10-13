/**
 * Support resources by country (spec 23, C-33).
 *
 * Every entry records where it was checked and when. Add a country by adding
 * verified entries here; no code changes are needed. Countries without
 * verified entries get the international directory instead. Entries must be
 * re-verified before each release.
 */

export interface SupportResource {
  name: string;
  description: string;
  /** Digits and + only, for the tel: link. */
  phone?: string;
  /** How the number is shown. */
  phoneLabel?: string;
  url?: string;
  hours?: string;
  source: string;
  verifiedOn: string;
}

export interface CountryResources {
  name: string;
  emergency: { number: string; note: string; source: string; verifiedOn: string };
  resources: SupportResource[];
}

export const SUPPORT_RESOURCES: Record<string, CountryResources> = {
  IN: {
    name: "India",
    emergency: {
      number: "112",
      note: "National emergency number (police, fire, ambulance) through the Emergency Response Support System.",
      source: "https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss",
      verifiedOn: "2026-10-12",
    },
    resources: [
      {
        name: "Tele-MANAS",
        description:
          "The Government of India's free mental health helpline, with trained counsellors. Choose your language when you call.",
        phone: "14416",
        phoneLabel: "14416 or 1-800-891-4416",
        url: "https://telemanas.mohfw.gov.in/",
        hours: "24 hours, every day",
        source: "https://findahelpline.com/countries/in · https://telemanas.mohfw.gov.in/",
        verifiedOn: "2026-10-12",
      },
      {
        name: "Vandrevala Foundation",
        description: "Free mental health support by phone, text or chat.",
        phone: "+919999666555",
        phoneLabel: "+91 9999 666 555",
        hours: "24 hours, every day",
        source: "https://findahelpline.com/countries/in",
        verifiedOn: "2026-10-12",
      },
    ],
  },
};

/** Reliable international directory used when a country has no verified entries. */
export const INTERNATIONAL_DIRECTORY = {
  name: "Find A Helpline",
  description: "A directory of free, confidential helplines in many countries.",
  url: "https://findahelpline.com/",
  source: "https://findahelpline.com/",
  verifiedOn: "2026-10-12",
};

/**
 * Country from the device's language and region setting, e.g. "en-IN" → "IN".
 * Never from location tracking (spec 23).
 */
export function countryFromLanguages(languages: readonly string[]): string | null {
  for (const tag of languages) {
    const region = tag.split("-").slice(1).find((part) => /^[A-Za-z]{2}$/.test(part));
    if (region) return region.toUpperCase();
  }
  return null;
}
