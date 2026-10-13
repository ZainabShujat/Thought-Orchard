import * as THREE from "three";

/**
 * Stepped lighting for the pixel-art look (spec 18.3): a 3-band gradient
 * sampled with nearest filtering, so surfaces shade in hard steps instead
 * of smooth gradients.
 */
let gradientMap: THREE.DataTexture | null = null;

function getGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    gradientMap = new THREE.DataTexture(new Uint8Array([90, 175, 255]), 3, 1, THREE.RedFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

export interface ToonOptions {
  flat?: boolean;
  vertexColors?: boolean;
  /**
   * Pixel-dither see-through, used when a canopy would hide the explorer
   * (spec 20.3). Hashed alpha needs no sorting and reads as a dither pattern
   * at low resolution.
   */
  dither?: boolean;
}

/**
 * Shared toon material per colour and option set. Materials live for the
 * lifetime of the page and are reused by every tree, so they are never
 * disposed per mesh.
 */
export function toonMaterial(color: string, options: ToonOptions = {}): THREE.MeshToonMaterial {
  const key = `${color}|${options.flat ? 1 : 0}|${options.vertexColors ? 1 : 0}|${options.dither ? 1 : 0}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshToonMaterial({
      color,
      gradientMap: getGradientMap(),
      vertexColors: options.vertexColors ?? false,
    });
    // MeshToonMaterial has no flatShading in its typings but supports the define.
    (material as THREE.MeshToonMaterial & { flatShading: boolean }).flatShading = options.flat ?? false;
    if (options.dither) {
      material.transparent = false;
      material.opacity = 0.3;
      material.alphaHash = true;
    }
    cache.set(key, material);
  }
  return material;
}

const brightCache = new Map<string, string>();

/** One shade lighter, for the brief leaf brightening after watering (spec 5.5). */
export function brighten(color: string): string {
  let out = brightCache.get(color);
  if (!out) {
    out = "#" + new THREE.Color(color).offsetHSL(0, 0.05, 0.1).getHexString();
    brightCache.set(color, out);
  }
  return out;
}

const basicCache = new Map<string, THREE.MeshBasicMaterial>();

/** Unlit material for glowing points (light points, droplets). */
export function glowMaterial(color: string): THREE.MeshBasicMaterial {
  let material = basicCache.get(color);
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color });
    basicCache.set(color, material);
  }
  return material;
}
