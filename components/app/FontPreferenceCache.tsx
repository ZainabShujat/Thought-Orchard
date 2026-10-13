"use client";

import { useEffect } from "react";

/**
 * A per-device cache of the plain-font setting, so public pages (landing,
 * sign-in, support) open in the font the person chose. The account profile in
 * MongoDB is the source of truth; this only mirrors it.
 */
const KEY = "thought-orchard:plain-font";

export function cacheFontPreference(plain: boolean): void {
  try {
    window.localStorage.setItem(KEY, plain ? "1" : "0");
  } catch {
    // Storage unavailable: public pages fall back to the pixel font.
  }
}

export function FontPreferenceCache() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") document.documentElement.dataset.font = "plain";
    } catch {
      // Ignore: the default font is fine.
    }
  }, []);
  return null;
}
