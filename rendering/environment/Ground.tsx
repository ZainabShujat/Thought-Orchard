"use client";

import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { createRng, hashString, pick, range } from "@/lib/random";
import { FOREST_EDGE, WORLD_LAYOUT, isOnPath, nearestPath } from "@/features/world/worldLayout";
import { PALETTE } from "@/rendering/pixel/palette";
import { toonMaterial } from "@/rendering/pixel/toonMaterials";
import { getTerrainHeight } from "@/rendering/environment/terrain";

const GROUND_SIZE = 150;
const GROUND_SEGMENTS = 150;

type Area = { x: number; z: number; r: number };

function openAreas(openRegionIds: string[]): Area[] {
  return WORLD_LAYOUT.regions
    .filter((r) => openRegionIds.includes(r.id))
    .map((r) => ({ x: r.center.x, z: r.center.z, r: r.radius }));
}

const inside = (areas: Area[], x: number, z: number, margin = 0) =>
  areas.some((a) => Math.hypot(x - a.x, z - a.z) <= a.r + margin);

/**
 * Terrain with paths painted into it. Each triangle gets one flat colour,
 * which reads as chunky pixel tiles at low resolution. Open regions are
 * meadow; everywhere else is forest floor.
 */
function buildGroundGeometry(areas: Area[]): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS);
  plane.rotateX(-Math.PI / 2);
  const geo = plane.toNonIndexed();
  plane.dispose();

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, getTerrainHeight(pos.getX(i), pos.getZ(i)));

  const meadow = [PALETTE.leafMid, PALETTE.leafMid, PALETTE.leafLight, PALETTE.leafDark].map((c) => new THREE.Color(c));
  const forestFloor = [PALETTE.leafDeep, PALETTE.leafDark, PALETTE.leafDeep].map((c) => new THREE.Color(c));
  const pathEdge = new THREE.Color(PALETTE.dirt);
  const pathCore = new THREE.Color(PALETTE.dirtLight);
  const pathShade = new THREE.Color(PALETTE.soil);
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  for (let tri = 0; tri < pos.count; tri += 3) {
    const cx = (pos.getX(tri) + pos.getX(tri + 1) + pos.getX(tri + 2)) / 3;
    const cz = (pos.getZ(tri) + pos.getZ(tri + 1) + pos.getZ(tri + 2)) / 3;
    const { distance, halfWidth } = nearestPath(cx, cz);
    const cell = hashString(`${Math.round(cx)}:${Math.round(cz)}`);

    if (distance < halfWidth) {
      // Cracked, sunlit dirt: mostly light, with darker cracks (18.9).
      color.copy(distance < halfWidth * 0.55 ? (cell % 7 === 0 ? pathShade : pathCore) : pathEdge);
    } else if (inside(areas, cx, cz)) {
      color.copy(meadow[cell % meadow.length]);
    } else {
      color.copy(forestFloor[cell % forestFloor.length]);
    }
    for (let v = 0; v < 3; v++) colors.set([color.r, color.g, color.b], (tri + v) * 3);
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

interface Scatter {
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
}

function emptyScatter(): Scatter {
  return { matrices: [], colors: [] };
}

function add(s: Scatter, dummy: THREE.Object3D, color: string) {
  dummy.updateMatrix();
  s.matrices.push(dummy.matrix.clone());
  s.colors.push(new THREE.Color(color));
}

/** Grass clumps in clusters, and sparse wildflower patches, inside open regions. */
function buildMeadow(areas: Area[]): { grass: Scatter; flowers: Scatter } {
  const grass = emptyScatter();
  const flowers = emptyScatter();
  const dummy = new THREE.Object3D();
  const rng = createRng(77);

  for (const area of areas) {
    const clusters = Array.from({ length: Math.round(area.r * 2) }, () => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * area.r;
      return { x: area.x + Math.cos(a) * r, z: area.z + Math.sin(a) * r };
    });
    for (let i = 0; i < area.r * 18; i++) {
      const c = pick(rng, clusters);
      const x = c.x + (rng() - 0.5) * 4;
      const z = c.z + (rng() - 0.5) * 4;
      if (isOnPath(x, z, 0.3)) continue;
      dummy.position.set(x, getTerrainHeight(x, z), z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const s = range(rng, 0.5, 1.0);
      dummy.scale.set(s, s * range(rng, 0.8, 1.4), s);
      add(grass, dummy, pick(rng, [PALETTE.leafDark, PALETTE.leafMid, PALETTE.leafLight, PALETTE.leafSun]));
    }
    for (let i = 0; i < area.r * 6; i++) {
      const c = pick(rng, clusters);
      const x = c.x + (rng() - 0.5) * 3;
      const z = c.z + (rng() - 0.5) * 3;
      if (isOnPath(x, z, 0.2)) continue;
      dummy.position.set(x, getTerrainHeight(x, z) + 0.12, z);
      dummy.rotation.set(0, rng() * Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      add(flowers, dummy, pick(rng, [PALETTE.blossomPink, PALETTE.flowerYellow, PALETTE.blossomWhite, PALETTE.flowerViolet]));
    }
  }
  return { grass, flowers };
}

/** Low bushes lining both sides of every path, framing the walk (references 03, 04). */
function buildPathBushes(areas: Area[]): Scatter {
  const bushes = emptyScatter();
  const dummy = new THREE.Object3D();
  const rng = createRng(3301);

  for (const path of WORLD_LAYOUT.paths) {
    for (let i = 0; i < path.points.length - 1; i++) {
      const a = path.points[i];
      const b = path.points[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const nx = -(b.z - a.z) / len;
      const nz = (b.x - a.x) / len;
      for (let s = 0; s < len; s += 1.3) {
        for (const side of [-1, 1]) {
          if (rng() < 0.55) continue;
          const t = s / len;
          const off = path.halfWidth + range(rng, 0.7, 1.8);
          const x = a.x + (b.x - a.x) * t + nx * off * side;
          const z = a.z + (b.z - a.z) * t + nz * off * side;
          if (isOnPath(x, z, 0.4)) continue;
          const size = range(rng, 0.22, 0.45) * (inside(areas, x, z) ? 1 : 1.5);
          dummy.position.set(x, getTerrainHeight(x, z) + size * 0.4, z);
          dummy.rotation.set(rng(), rng() * Math.PI, rng());
          dummy.scale.set(size * 1.2, size * 0.8, size * 1.2);
          add(bushes, dummy, pick(rng, [PALETTE.leafDark, PALETTE.leafMid, PALETTE.leafDeep]));
        }
      }
    }
  }
  return bushes;
}

/**
 * The forest: tall trees everywhere outside open regions and paths, taller
 * than any thought-tree (spec 20.1), so the orchard sits in clearings.
 */
/**
 * Mostly broadleaf woodland, as in the references (03, 05, 09): tall bare
 * trunks under clustered rounded canopies, with a few conifers for variety.
 */
const CONIFER_SHARE = 0.15;

function buildForest(areas: Area[]): { trunks: Scatter; broadCrowns: Scatter; coniferCrowns: Scatter } {
  const rng = createRng(1203);
  const dummy = new THREE.Object3D();
  const trunks = emptyScatter();
  const broadCrowns = emptyScatter();
  const coniferCrowns = emptyScatter();
  const limit = FOREST_EDGE.extent;

  for (let i = 0; i < 2600 && trunks.matrices.length < 1100; i++) {
    const x = range(rng, -limit, limit);
    const z = range(rng, -limit, limit);
    if (Math.hypot(x, z) > limit + 4) continue;
    if (inside(areas, x, z, FOREST_EDGE.margin)) continue;
    if (isOnPath(x, z, 1.4)) continue;
    const y = getTerrainHeight(x, z);
    const h = range(rng, 8, 12);

    if (rng() < CONIFER_SHARE) {
      dummy.position.set(x, y + 1.1, z);
      dummy.rotation.set(0, rng() * Math.PI, 0);
      dummy.scale.set(0.38, 2.2, 0.38);
      add(trunks, dummy, PALETTE.barkDark);
      dummy.position.set(x, y + 2.2 + (h - 2.2) / 2, z);
      dummy.scale.set(h * 0.3, h - 2.2, h * 0.3);
      add(coniferCrowns, dummy, pick(rng, [PALETTE.leafDeep, PALETTE.leafDark]));
      continue;
    }

    // Broadleaf: a tall trunk, then two or three overlapping crown clusters.
    const trunkH = h * range(rng, 0.45, 0.55);
    dummy.position.set(x, y + trunkH / 2, z);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.set(range(rng, 0.32, 0.45), trunkH, range(rng, 0.32, 0.45));
    add(trunks, dummy, pick(rng, [PALETTE.barkDark, PALETTE.bark]));

    const crownR = h * range(rng, 0.24, 0.3);
    const clusters = rng() < 0.5 ? 2 : 3;
    for (let c = 0; c < clusters; c++) {
      const a = rng() * Math.PI * 2;
      const off = c === 0 ? 0 : crownR * range(rng, 0.45, 0.7);
      const r = c === 0 ? crownR : crownR * range(rng, 0.6, 0.8);
      dummy.position.set(x + Math.cos(a) * off, y + trunkH + r * 0.7 + (c === 0 ? r * 0.2 : 0), z + Math.sin(a) * off);
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      dummy.scale.set(r, r * range(rng, 0.8, 0.95), r);
      add(broadCrowns, dummy, pick(rng, [PALETTE.leafDeep, PALETTE.leafDark, PALETTE.leafDark, PALETTE.leafMid]));
    }
  }
  return { trunks, broadCrowns, coniferCrowns };
}

function Instances({ geometry, data }: { geometry: THREE.BufferGeometry; data: Scatter }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => toonMaterial("#ffffff", { flat: true }), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    data.matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, data.colors[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data]);

  if (data.matrices.length === 0) return null;
  return <instancedMesh key={data.matrices.length} ref={ref} args={[geometry, material, data.matrices.length]} />;
}

interface GroundProps {
  openRegionIds: string[];
  /** A tap (not a drag) on the ground, at a world point. */
  onGroundTap?: (point: { x: number; z: number }) => void;
  tapMaxTravelPx: number;
}

export function Ground({ openRegionIds, onGroundTap, tapMaxTravelPx }: GroundProps) {
  const openKey = openRegionIds.join(",");
  const areas = useMemo(() => openAreas(openKey.split(",")), [openKey]);
  const groundGeometry = useMemo(() => buildGroundGeometry(areas), [areas]);
  const meadow = useMemo(() => buildMeadow(areas), [areas]);
  const bushes = useMemo(() => buildPathBushes(areas), [areas]);
  const forest = useMemo(() => buildForest(areas), [areas]);

  const grassGeo = useMemo(() => new THREE.ConeGeometry(0.16, 0.45, 4).translate(0, 0.22, 0), []);
  const flowerGeo = useMemo(() => new THREE.BoxGeometry(0.16, 0.16, 0.16), []);
  const bushGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.7, 1, 1, 5), []);
  const crownGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 6), []);

  useLayoutEffect(() => () => groundGeometry.dispose(), [groundGeometry]);
  useLayoutEffect(
    () => () => [grassGeo, flowerGeo, bushGeo, trunkGeo, crownGeo].forEach((g) => g.dispose()),
    [grassGeo, flowerGeo, bushGeo, trunkGeo, crownGeo]
  );

  const groundMaterial = useMemo(() => toonMaterial("#ffffff", { flat: true, vertexColors: true }), []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > tapMaxTravelPx) return;
    e.stopPropagation();
    onGroundTap?.({ x: e.point.x, z: e.point.z });
  };

  return (
    <group>
      <mesh geometry={groundGeometry} material={groundMaterial} onClick={handleClick} />
      <Instances geometry={grassGeo} data={meadow.grass} />
      <Instances geometry={flowerGeo} data={meadow.flowers} />
      <Instances geometry={bushGeo} data={bushes} />
      <Instances geometry={trunkGeo} data={forest.trunks} />
      <Instances geometry={bushGeo} data={forest.broadCrowns} />
      <Instances geometry={crownGeo} data={forest.coniferCrowns} />
    </group>
  );
}
