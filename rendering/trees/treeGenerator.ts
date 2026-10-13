import * as THREE from "three";
import { GrowthStage } from "@/types/thought";
import { createRng, pick, range } from "@/lib/random";
import { PALETTE } from "@/rendering/pixel/palette";

/**
 * Procedural tree family (spec 6.3, 18.5). A tree's shape is a pure
 * function of its growth stage and seed, so it looks the same on every load.
 * Heights follow the reference dimensions in spec 19.5.
 */

export type PartShape = "trunk" | "leaf" | "box" | "mound";

export interface TreePart {
  shape: PartShape;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  /** Leaves and blossoms sway; wood stays put. */
  sways: boolean;
}

export interface TreeModel {
  parts: TreePart[];
  /** Approximate top of the tree in metres, used for hit areas and camera framing. */
  height: number;
  /** Trunk radius at the base, used for movement collision (spec 20.8). */
  trunkRadius: number;
  /** Where warm light points may sit, in canopy order (spec 4.6). Up to 20. */
  lightAnchors: [number, number, number][];
  /** Centre and rough radius of the canopy, for occlusion checks and effects. */
  canopyCenter: [number, number, number];
  canopyRadius: number;
}

type Form = "round" | "tall" | "spreading";

/**
 * How care and neglect show on a tree (spec 5.4; 2026-10-13). Wind leans it
 * and deepens its roots, sunlight adds warm blossoms, a weak tree droops with
 * pale leaves, and a dead tree is bare grey wood. These use their own random
 * stream, so a tree keeps its shape and identity whatever its care.
 */
export interface TreeLook {
  health: "healthy" | "weak" | "dead";
  /** 0–3 */
  sunlightLevel: number;
  /** 0–3 */
  windLevel: number;
}

export const DEFAULT_LOOK: TreeLook = { health: "healthy", sunlightLevel: 0, windLevel: 0 };

const WILT = "#b9a65a";
const DEAD_WOOD = "#6f645b";
const DRY_LEAF = "#8a6a45";
const SUN_BLOSSOMS = [PALETTE.blossomPeach, PALETTE.flowerYellow, PALETTE.blossomPink] as const;

function mix(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  return `#${ca.lerp(new THREE.Color(b), t).getHexString()}`;
}

interface CanopySpec {
  trunkHeight: number;
  trunkRadius: number;
  canopyY: number;
  clusters: number;
  clusterRadius: [number, number];
  spread: number;
  blossoms: number;
  fruit: number;
  roots: number;
}

const CANOPY_STAGES: Partial<Record<GrowthStage, CanopySpec>> = {
  "young-tree": {
    trunkHeight: 1.8, trunkRadius: 0.13, canopyY: 2.3, clusters: 3,
    clusterRadius: [0.6, 0.85], spread: 0.6, blossoms: 0, fruit: 0, roots: 0,
  },
  blossoming: {
    trunkHeight: 2.4, trunkRadius: 0.19, canopyY: 3.3, clusters: 4,
    clusterRadius: [0.8, 1.0], spread: 0.95, blossoms: 9, fruit: 0, roots: 0,
  },
  flourishing: {
    trunkHeight: 2.8, trunkRadius: 0.25, canopyY: 3.9, clusters: 6,
    clusterRadius: [0.9, 1.2], spread: 1.35, blossoms: 20, fruit: 0, roots: 3,
  },
  "fully-grown": {
    trunkHeight: 3.3, trunkRadius: 0.32, canopyY: 4.7, clusters: 8,
    clusterRadius: [1.0, 1.4], spread: 1.8, blossoms: 10, fruit: 8, roots: 4,
  },
};

const LEAF_SETS = [
  [PALETTE.leafDark, PALETTE.leafMid, PALETTE.leafLight],
  [PALETTE.leafDeep, PALETTE.leafDark, PALETTE.leafMid],
  [PALETTE.leafMid, PALETTE.leafLight, PALETTE.leafSun],
] as const;

const BLOSSOM_COLORS = [PALETTE.blossomPink, PALETTE.blossomWhite, PALETTE.blossomPeach] as const;

const UP = new THREE.Vector3(0, 1, 0);

/** Rotation that points the +Y axis of a part along `dir`. */
function alignY(dir: THREE.Vector3): [number, number, number] {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

/** A cylinder part running from `from` to `to`. */
function limb(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  color: string
): TreePart {
  const dir = to.clone().sub(from);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  return {
    shape: "trunk",
    color,
    position: [mid.x, mid.y, mid.z],
    rotation: alignY(dir),
    scale: [radius, dir.length(), radius],
    sways: false,
  };
}

function box(
  position: [number, number, number],
  scale: [number, number, number],
  color: string,
  rotation: [number, number, number] = [0, 0, 0],
  sways = true
): TreePart {
  return { shape: "box", color, position, rotation, scale, sways };
}

function mound(radius: number): TreePart {
  return {
    shape: "mound",
    color: PALETTE.soil,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [radius, radius * 0.4, radius],
    sways: false,
  };
}

function smallStage(
  stage: GrowthStage,
  rng: () => number,
  lookRng: () => number,
  leaves: readonly string[],
  look: TreeLook
): TreeModel {
  const parts: TreePart[] = [];

  if (stage === "new-thought") {
    parts.push(mound(0.42));
    parts.push(box([0.05, 0.16, 0], [0.09, 0.07, 0.07], PALETTE.dirtLight, [0, 0.4, 0], false));
    parts.push(box([0, 0.24, 0], [0.04, 0.14, 0.04], PALETTE.leafLight));
    parts.push(box([0.05, 0.3, 0], [0.09, 0.04, 0.06], PALETTE.leafSun, [0, 0, -0.4]));
    return {
      parts, height: 0.35, trunkRadius: 0.3,
      lightAnchors: [[0.05, 0.12, 0.05]], canopyCenter: [0, 0.2, 0], canopyRadius: 0.3,
    };
  }

  if (stage === "seedling") {
    const h = range(rng, 0.45, 0.55);
    parts.push(mound(0.38));
    parts.push(limb(new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, h, 0), 0.035, PALETTE.leafDark));
    parts.push(box([-0.11, h, 0], [0.22, 0.04, 0.12], leaves[1], [0, 0, 0.45]));
    parts.push(box([0.11, h + 0.04, 0], [0.22, 0.04, 0.12], leaves[2], [0, 0, -0.45]));
    return {
      parts, height: h + 0.12, trunkRadius: 0.3,
      lightAnchors: [[-0.15, h + 0.06, 0.04], [0.15, h + 0.1, -0.04]],
      canopyCenter: [0, h, 0], canopyRadius: 0.3,
    };
  }

  // budding
  const h = range(rng, 1.0, 1.15);
  parts.push(mound(0.35));
  parts.push(limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), 0.05, PALETTE.barkLight));
  const twigs = 3;
  for (let i = 0; i < twigs; i++) {
    const a = (i / twigs) * Math.PI * 2 + rng() * 0.8;
    const y = h * range(rng, 0.5, 0.85);
    const start = new THREE.Vector3(0, y, 0);
    const end = new THREE.Vector3(Math.cos(a) * 0.32, y + 0.22, Math.sin(a) * 0.32);
    parts.push(limb(start, end, 0.025, PALETTE.barkLight));
    parts.push({
      shape: "leaf", color: pick(rng, leaves), position: [end.x, end.y, end.z],
      rotation: [rng(), rng(), rng()], scale: [0.16, 0.14, 0.16], sways: true,
    });
  }
  parts.push({
    shape: "leaf", color: leaves[1], position: [0, h + 0.05, 0],
    rotation: [0, rng(), 0], scale: [0.2, 0.18, 0.2], sways: true,
  });
  parts.push(box([0, h + 0.24, 0], [0.09, 0.09, 0.09], PALETTE.blossomPink));
  for (let i = 0; i < look.sunlightLevel; i++) {
    const a = lookRng() * Math.PI * 2;
    parts.push(box([Math.cos(a) * 0.22, h * range(lookRng, 0.75, 1.05), Math.sin(a) * 0.22], [0.08, 0.08, 0.08], pick(lookRng, SUN_BLOSSOMS)));
  }
  return {
    parts, height: h + 0.3, trunkRadius: 0.3,
    lightAnchors: [[0, h + 0.18, 0.12], [0.2, h * 0.8, 0.15], [-0.22, h * 0.7, -0.1]],
    canopyCenter: [0, h * 0.8, 0], canopyRadius: 0.5,
  };
}

function canopyStage(
  spec: CanopySpec,
  rng: () => number,
  lightRng: () => number,
  lookRng: () => number,
  leaves: readonly string[],
  form: Form,
  look: TreeLook
): TreeModel {
  const parts: TreePart[] = [];
  const sizeMul = range(rng, 0.92, 1.08);

  let canopyY = spec.canopyY * sizeMul;
  let spread = spec.spread * sizeMul * (1 + 0.07 * look.windLevel);
  let ySquash = 1;
  if (form === "tall") {
    canopyY += 0.5;
    spread *= 0.75;
  } else if (form === "spreading") {
    canopyY -= 0.3;
    spread *= 1.3;
    ySquash = 0.75;
  }

  const trunkTop = spec.trunkHeight * sizeMul;
  const lean = new THREE.Vector3((rng() - 0.5) * 0.25, 0, (rng() - 0.5) * 0.25);
  // Wind: a lean in one direction, stronger with more wind.
  const windAngle = lookRng() * Math.PI * 2;
  lean.add(new THREE.Vector3(Math.cos(windAngle), 0, Math.sin(windAngle)).multiplyScalar(0.2 * look.windLevel));
  const trunkEnd = new THREE.Vector3(0, trunkTop, 0).add(lean);
  parts.push(limb(new THREE.Vector3(0, -0.1, 0), trunkEnd, spec.trunkRadius, PALETTE.bark));

  const roots = spec.roots + look.windLevel;
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * Math.PI * 2 + (i < spec.roots ? rng() : lookRng()) * 0.6;
    const out = new THREE.Vector3(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6);
    parts.push(limb(new THREE.Vector3(0, 0.45, 0), out, spec.trunkRadius * 0.5, PALETTE.barkDark));
  }

  // Canopy clusters: one central crown plus a ring around it.
  const clusters: { center: THREE.Vector3; r: number }[] = [];
  const maxR = spec.clusterRadius[1] * sizeMul;
  clusters.push({ center: new THREE.Vector3(lean.x, canopyY + maxR * 0.3, lean.z), r: maxR });

  for (let i = 1; i < spec.clusters; i++) {
    const a = (i / (spec.clusters - 1)) * Math.PI * 2 + (rng() - 0.5) * 0.7;
    const radial = spread * range(rng, 0.65, 1.0);
    const r = range(rng, spec.clusterRadius[0], spec.clusterRadius[1]) * sizeMul;
    const y = canopyY + (rng() - 0.5) * r * 0.9 * ySquash;
    clusters.push({
      center: new THREE.Vector3(lean.x + Math.cos(a) * radial, y, lean.z + Math.sin(a) * radial),
      r,
    });
  }

  // Branches run from the upper trunk toward the outer clusters.
  clusters.slice(1).forEach((c) => {
    const startY = trunkTop * range(rng, 0.65, 0.95);
    const start = new THREE.Vector3(lean.x * (startY / trunkTop), startY, lean.z * (startY / trunkTop));
    const end = start.clone().lerp(c.center, 0.8);
    parts.push(limb(start, end, spec.trunkRadius * 0.45, PALETTE.bark));
  });

  let top = 0;
  clusters.forEach((c, i) => {
    // Upper clusters catch more light.
    const color = c.center.y > canopyY + 0.2 ? leaves[2] : i % 2 === 0 ? leaves[1] : leaves[0];
    parts.push({
      shape: "leaf",
      color,
      position: [c.center.x, c.center.y, c.center.z],
      rotation: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI],
      scale: [c.r, c.r * 0.85 * ySquash, c.r],
      sways: true,
    });
    top = Math.max(top, c.center.y + c.r * 0.85 * ySquash);
  });

  const blossomColor = pick(rng, BLOSSOM_COLORS);
  const dot = (count: number, color: string | (() => string), size: number, r_ = rng) => {
    for (let i = 0; i < count; i++) {
      const c = pick(r_, clusters);
      const theta = r_() * Math.PI * 2;
      const phi = range(r_, 0.1, 1.3); // upper and side surfaces
      const r = c.r * 0.92;
      parts.push(
        box(
          [
            c.center.x + Math.sin(phi) * Math.cos(theta) * r,
            c.center.y + Math.cos(phi) * r * 0.85 * ySquash,
            c.center.z + Math.sin(phi) * Math.sin(theta) * r,
          ],
          [size, size, size],
          typeof color === "function" ? color() : color,
          [0, theta, 0]
        )
      );
    }
  };
  dot(spec.blossoms, blossomColor, 0.2);
  dot(spec.fruit, PALETTE.fruitAmber, 0.18);
  // Sunlight: warm blossoms on top of the tree's own.
  dot(5 * look.sunlightLevel, () => pick(lookRng, SUN_BLOSSOMS), 0.2, lookRng);

  const lightAnchors: [number, number, number][] = [];
  for (let i = 0; i < 20; i++) {
    const c = clusters[(i * 7) % clusters.length];
    const theta = lightRng() * Math.PI * 2;
    const phi = range(lightRng, 0.2, 1.9);
    const r = c.r * 1.02;
    lightAnchors.push([
      c.center.x + Math.sin(phi) * Math.cos(theta) * r,
      c.center.y + Math.cos(phi) * r * 0.85 * ySquash,
      c.center.z + Math.sin(phi) * Math.sin(theta) * r,
    ]);
  }

  return {
    parts,
    height: top,
    trunkRadius: spec.trunkRadius,
    lightAnchors,
    canopyCenter: [lean.x, canopyY, lean.z],
    canopyRadius: spread + maxR,
  };
}

/** Weak: leaves pale and droop, fruit falls. Dead: bare grey wood, a dry sprout on small stages. */
function applyHealth(model: TreeModel, look: TreeLook, small: boolean): TreeModel {
  if (look.health === "healthy") return model;
  const isFoliage = (p: TreePart) => p.sways;
  let parts: TreePart[];
  if (look.health === "weak") {
    parts = model.parts
      .filter((p) => !(p.color === PALETTE.fruitAmber && p.shape === "box"))
      .map((p) => {
        if (!isFoliage(p)) return p;
        const droop = p.shape === "leaf" ? p.scale[1] * 0.15 : 0.05;
        return {
          ...p,
          color: mix(p.color, WILT, p.shape === "leaf" ? 0.5 : 0.6),
          position: [p.position[0], p.position[1] - droop, p.position[2]],
          scale: p.shape === "leaf" ? [p.scale[0], p.scale[1] * 0.85, p.scale[2]] : p.scale,
        };
      });
  } else {
    parts = model.parts
      .filter((p) => small || !isFoliage(p))
      .map((p) => {
        if (p.shape === "mound") return p;
        if (isFoliage(p)) return { ...p, color: DRY_LEAF, position: [p.position[0], p.position[1] * 0.8, p.position[2]] };
        return { ...p, color: mix(p.color, DEAD_WOOD, 0.75) };
      });
  }
  return { ...model, parts };
}

const modelCache = new Map<string, TreeModel>();

export function generateTree(stage: GrowthStage, seed: number, look: TreeLook = DEFAULT_LOOK): TreeModel {
  const key = `${stage}:${seed}:${look.health}:${look.sunlightLevel}:${look.windLevel}`;
  const cached = modelCache.get(key);
  if (cached) return cached;

  const rng = createRng(seed);
  const leaves = pick(rng, LEAF_SETS);
  const form = pick(rng, ["round", "tall", "spreading"] as const);
  const spec = CANOPY_STAGES[stage];
  // Light anchors use their own stream so adding them never changes a tree's shape.
  const lightRng = createRng(seed ^ 0x5bd1e995);
  // Care and health features use a third stream, for the same reason.
  const lookRng = createRng(seed ^ 0x2c1b3c6d);
  const shaped = spec
    ? canopyStage(spec, rng, lightRng, lookRng, leaves, form, look)
    : smallStage(stage, rng, lookRng, leaves, look);
  const model = applyHealth(shaped, look, !spec);

  modelCache.set(key, model);
  return model;
}
