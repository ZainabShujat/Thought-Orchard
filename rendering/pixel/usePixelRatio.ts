"use client";

import { useSyncExternalStore } from "react";

/**
 * Target size, in render pixels, of the screen's shorter side (OD-18).
 * 240 gives roughly 480x270 on a 1080p desktop and 234x506 on a portrait phone.
 */
export const PIXEL_TARGET_SHORT_SIDE = 240;

/**
 * Renderer pixel ratio for the low-resolution pixel look (spec 18.3).
 *
 * Each render pixel covers a whole number N of device pixels, so the
 * nearest-neighbour upscale stays crisp. The renderer ratio is therefore
 * devicePixelRatio / N, which is usually well below 1.
 */
export function computePixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number
): { dpr: number; scale: number } {
  const shortSideDevicePx = Math.min(cssWidth, cssHeight) * devicePixelRatio;
  const scale = Math.max(1, Math.round(shortSideDevicePx / PIXEL_TARGET_SHORT_SIDE));
  return { dpr: devicePixelRatio / scale, scale };
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function getSnapshot(): number {
  return computePixelRatio(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1).dpr;
}

function getServerSnapshot(): number {
  return 0.25;
}

export function usePixelRatio(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
