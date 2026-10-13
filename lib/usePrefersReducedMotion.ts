"use client";

import { useSyncExternalStore } from "react";
import { usePreferences } from "@/components/app/ProfileProvider";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Whether to reduce motion: the account's setting ("reduce" or "full") wins;
 * "system" follows the device (spec 7.3, 22.2).
 */
export function usePrefersReducedMotion(): boolean {
  const system = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
  const { motion } = usePreferences();
  if (motion === "reduce") return true;
  if (motion === "full") return false;
  return system;
}
