"use client";

import { useCallback, useEffect, useRef, useState } from "react";

let cached: boolean | null = null;

/**
 * Whether this device can draw WebGL. Checked once per page, and the test
 * context is released straight away.
 *
 * Browsers allow only about 16 live WebGL contexts per page and silently kill
 * the oldest when more are made — which was the orchard's own. Never create a
 * test context on every render.
 */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    cached = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** How long to wait for the browser to give a lost context back before rebuilding the scene ourselves. */
const RESTORE_WAIT_MS = 1500;

/**
 * Recovers from a lost WebGL context (a GPU reset, the device sleeping, the
 * browser reclaiming memory). Call `attach` from the Canvas's `onCreated`;
 * render the Canvas with `key={canvasKey}` and hide it while `lost`. When the
 * context is lost the scene is rebuilt with a fresh one, so the world comes
 * back on its own instead of leaving a blank page.
 */
export function useWebGLRecovery() {
  const [canvasKey, setCanvasKey] = useState(0);
  const [lost, setLost] = useState(false);
  const timer = useRef<number | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  const rebuild = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setLost(false);
    setCanvasKey((k) => k + 1);
  }, []);

  const attach = useCallback(
    (canvas: HTMLCanvasElement) => {
      cleanup.current?.();
      const onLost = (e: Event) => {
        // Allows the browser to restore the context; without this it never will.
        e.preventDefault();
        setLost(true);
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(rebuild, RESTORE_WAIT_MS);
      };
      // Restored or not, a fresh renderer is the reliable way back: rebuild.
      const onRestored = () => rebuild();
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
      cleanup.current = () => {
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
      };
    },
    [rebuild]
  );

  useEffect(
    () => () => {
      cleanup.current?.();
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  return { canvasKey, lost, attach };
}
