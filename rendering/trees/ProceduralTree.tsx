"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Thought } from "@/types/thought";
import { CareType, GrowthState, lightPointCount } from "@/features/growth/growthModel";
import { getTerrainHeight } from "@/rendering/environment/terrain";
import { PALETTE } from "@/rendering/pixel/palette";
import { brighten, glowMaterial, toonMaterial } from "@/rendering/pixel/toonMaterials";
import { getTreeModel } from "@/rendering/trees/treeIdentity";
import { PartShape } from "@/rendering/trees/treeGenerator";
import { ExplorerState, ViewMode } from "@/rendering/movement/explorerState";

/** Pointer travel (CSS px) above which a press counts as a drag, not a tap (spec 17.6). */
export const TAP_MAX_TRAVEL_PX = 8;
/** How close you must be for a tree to brighten and invite opening (spec 5.5). */
const NEAR_DISTANCE: Record<ViewMode, number> = { immersive: 6, explorer: 3.5 };

/** Visual state of a care action, driven by the page (spec 5.5). */
export interface CareFx {
  kind: "pending" | "counted" | "uncounted" | "failed";
  /** Water falls as droplets, sunlight rises as warm motes, wind blows leaves sideways. */
  type: CareType;
  /** Changes on every new event so repeated waterings replay. */
  key: number;
}

// Unit geometries shared by every tree for the life of the page.
const GEOMETRIES: Record<PartShape, THREE.BufferGeometry> = {
  trunk: new THREE.CylinderGeometry(0.7, 1, 1, 6),
  leaf: new THREE.IcosahedronGeometry(1, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
  mound: new THREE.SphereGeometry(1, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2),
};
const HIT_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 8);
const SHADOW_GEOMETRY = new THREE.CircleGeometry(1, 10);
const RING_GEOMETRY = new THREE.RingGeometry(0.85, 1, 16);
const MARKER_GEOMETRY = new THREE.OctahedronGeometry(0.22, 0);
// Large enough to read as one or two render pixels from across a clearing.
const POINT_GEOMETRY = new THREE.BoxGeometry(0.24, 0.24, 0.24);
const DROP_GEOMETRY = new THREE.BoxGeometry(0.07, 0.14, 0.07);
// Sunlight: a warm glow above the canopy with rays around it.
const SUN_GEOMETRY = new THREE.IcosahedronGeometry(0.32, 1);
const RAY_GEOMETRY = new THREE.BoxGeometry(0.06, 0.42, 0.06);
const RAY_COUNT = 8;
// Wind: small flat leaves tumbling past.
const FLAKE_GEOMETRY = new THREE.BoxGeometry(0.16, 0.025, 0.1);
const FLAKE_COUNT = 12;

const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
const shadowMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.leafDark });
const selectRingMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.amber, side: THREE.DoubleSide });
const hoverRingMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.blossomWhite, side: THREE.DoubleSide });

const DROP_COUNT = 18;
const DROP_SECONDS = 1.1;
/** How long each care effect plays after it's confirmed. */
const FX_SECONDS: Record<CareType, number> = { water: DROP_SECONDS, sunlight: 2.4, wind: 2.4 };
const BRIGHT_SECONDS = 2;
const GROW_SECONDS = 0.6;
const GROW_STEPS = 4;

interface ProceduralTreeProps {
  thought: Thought;
  growth: GrowthState;
  isSelected: boolean;
  explorer: React.RefObject<ExplorerState>;
  view: ViewMode;
  careFx: CareFx | null;
  lightColors: { color: string; nearColor: string };
  reducedMotion: boolean;
  onTap: (thought: Thought) => void;
}

const _seg = new THREE.Vector3();
const _toP = new THREE.Vector3();
const _p = new THREE.Vector3();

function distanceToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  _seg.subVectors(b, a);
  _toP.subVectors(p, a);
  const t = THREE.MathUtils.clamp(_toP.dot(_seg) / Math.max(1e-6, _seg.lengthSq()), 0, 1);
  return p.distanceTo(_p.copy(a).addScaledVector(_seg, t));
}

export function ProceduralTree({
  thought,
  growth,
  isSelected,
  explorer: explorerRef,
  view,
  careFx,
  lightColors,
  reducedMotion,
  onTap,
}: ProceduralTreeProps) {
  const rootRef = useRef<THREE.Group>(null);
  const swayRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const lightsRef = useRef<THREE.Group>(null);
  const dropsRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.Group>(null);
  const windRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [near, setNear] = useState(false);
  const [dithered, setDithered] = useState(false);
  const [bright, setBright] = useState(false);

  const { x, z } = thought.position;
  const y = useMemo(() => getTerrainHeight(x, z), [x, z]);
  const { health, sunlightLevel, windLevel } = growth;
  const model = useMemo(
    () => getTreeModel(thought, growth.stage, { health, sunlightLevel, windLevel }),
    [thought, growth.stage, health, sunlightLevel, windLevel]
  );
  const footprint = Math.max(0.45, Math.min(2.2, model.height * 0.3));
  // Within a stage the canopy fills out from 90% to 100% (spec 4.6).
  const fullness = growth.stageNumber >= 4 ? 0.9 + 0.1 * growth.progress : 1;
  const lightCount = lightPointCount(growth);
  // Points scale with the tree: a speck on a sprout, a lantern-glow on a grown tree.
  const pointScale = Math.min(1, Math.max(0.3, model.height / 5));

  // Stage change: a short stepped grow, never on first appearance (spec 4.4, 5.5).
  const prevStage = useRef(growth.stageNumber);
  const growStart = useRef<number | null>(null);
  useEffect(() => {
    if (growth.stageNumber > prevStage.current) growStart.current = reducedMotion ? null : -1;
    prevStage.current = growth.stageNumber;
  }, [growth.stageNumber, reducedMotion]);

  // Watering: droplets while pending and briefly after; leaves brighten when confirmed.
  const dropStart = useRef<number | null>(null);
  const dropUntilConfirmed = useRef(false);
  /** -1 means "start brightening on the next frame"; otherwise a clock time to stop at. */
  const brightUntil = useRef<number | null>(null);
  /** -1 means "start a gust next frame"; otherwise the clock time it started. */
  const gustStart = useRef<number | null>(null);
  const fxType: CareType = careFx?.type ?? "water";
  useEffect(() => {
    if (!careFx) return;
    if (careFx.kind === "pending") {
      dropStart.current = -1;
      dropUntilConfirmed.current = true;
    } else {
      dropUntilConfirmed.current = false;
      if (careFx.kind === "failed") {
        dropStart.current = null;
        return;
      }
      brightUntil.current = -1;
      if (careFx.type === "wind") gustStart.current = -1;
    }
  }, [careFx]);

  const dropSeeds = useMemo(
    () =>
      Array.from({ length: DROP_COUNT }, (_, i) => {
        const a = (i / DROP_COUNT) * Math.PI * 2 + i;
        const r = model.canopyRadius * (0.3 + ((i * 37) % 10) / 14);
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, phase: ((i * 13) % 10) / 10 };
      }),
    [model.canopyRadius]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const explorer = explorerRef.current;

    // Gentle sway.
    if (swayRef.current) {
      if (gustStart.current === -1) gustStart.current = t;
      const gust = gustStart.current === null ? 0 : Math.max(0, 1 - (t - gustStart.current) / 2.2);
      if (gust === 0) gustStart.current = null;
      // A weak tree hangs still; a gust of wind swings any living tree.
      const base = health === "healthy" ? 0.012 : health === "weak" ? 0.004 : 0;
      const amount = reducedMotion ? 0 : base + (health === "dead" ? 0 : gust * 0.07);
      const phase = x * 0.4 + z * 0.4;
      swayRef.current.rotation.z = Math.sin(t * (1.3 + gust * 4) + phase) * amount;
      swayRef.current.rotation.x = Math.cos(t * 1.1 + phase) * amount * 0.7;
    }

    // Stepped grow animation.
    if (rootRef.current) {
      if (growStart.current === -1) growStart.current = t;
      let s = 1;
      if (growStart.current !== null) {
        const k = (t - growStart.current) / GROW_SECONDS;
        if (k >= 1) growStart.current = null;
        else s = 0.8 + 0.2 * (Math.ceil(k * GROW_STEPS) / GROW_STEPS);
      }
      rootRef.current.scale.setScalar(s);
    }

    // Leaves brighten briefly after a confirmed watering (spec 5.5).
    if (brightUntil.current === -1) brightUntil.current = t + BRIGHT_SECONDS;
    const shouldBright = brightUntil.current !== null && t < brightUntil.current;
    if (!shouldBright) brightUntil.current = null;
    if (shouldBright !== bright) setBright(shouldBright);

    // Approach: brighten when the explorer is close.
    const d = Math.hypot(explorer.x - x, explorer.z - z);
    const isNear = d <= NEAR_DISTANCE[view] + model.trunkRadius;
    if (isNear !== near) setNear(isNear);

    // Explorer view: dither a canopy that sits between the camera and the explorer.
    let shouldDither = false;
    if (view === "explorer" && model.height > 2) {
      const head = new THREE.Vector3(explorer.x, getTerrainHeight(explorer.x, explorer.z) + 1.2, explorer.z);
      const canopy = new THREE.Vector3(x + model.canopyCenter[0], y + model.canopyCenter[1], z + model.canopyCenter[2]);
      shouldDither = distanceToSegment(canopy, state.camera.position, head) < model.canopyRadius * 0.9;
    }
    if (shouldDither !== dithered) setDithered(shouldDither);

    // Light points twinkle in stepped frames.
    if (lightsRef.current) {
      const frame = reducedMotion ? 0 : Math.floor(t * 2);
      lightsRef.current.children.forEach((child, i) => {
        child.visible = reducedMotion || (frame + i * 3) % 7 !== 0;
      });
    }

    // Care effects: water falls as droplets, sunlight glows above the canopy, wind blows leaves past.
    if (dropStart.current === -1) dropStart.current = t;
    const start = dropStart.current;
    const elapsed = start === null ? 0 : t - start;
    const active =
      start !== null && (dropUntilConfirmed.current || elapsed < FX_SECONDS[fxType]) && !(reducedMotion && elapsed > 0.6);
    if (!active && start !== null && !dropUntilConfirmed.current) dropStart.current = null;
    const top = Math.max(0.6, model.canopyCenter[1] + model.canopyRadius * 0.3);

    if (dropsRef.current) {
      dropsRef.current.visible = active && fxType === "water";
      if (dropsRef.current.visible) {
        dropsRef.current.children.forEach((child, i) => {
          const seed = dropSeeds[i];
          const step = Math.floor((((elapsed * 1.4 + seed.phase) % 1) * 6)) / 6;
          if (reducedMotion) child.position.set(seed.x, 0.08, seed.z); // a static splash
          else child.position.set(seed.x, top * (1 - step), seed.z);
        });
      }
    }

    if (sunRef.current) {
      sunRef.current.visible = active && fxType === "sunlight";
      if (sunRef.current.visible) {
        // Rises gently, swells and then settles; the rays turn slowly.
        const k = Math.min(1, elapsed / 0.6);
        const fade = Math.max(0, Math.min(1, (FX_SECONDS.sunlight - elapsed) / 0.8));
        const s = reducedMotion ? 1 : (0.6 + 0.5 * k) * (0.7 + 0.3 * fade) * (1 + Math.floor(Math.sin(t * 6) * 2) * 0.04);
        sunRef.current.position.set(model.canopyCenter[0], model.height + 0.5 + (reducedMotion ? 0 : 0.3 * k), model.canopyCenter[2]);
        sunRef.current.scale.setScalar(Math.max(0.3, model.height / 4) * s);
        sunRef.current.rotation.y = reducedMotion ? 0 : Math.floor(t * 4) * (Math.PI / 16);
      }
    }

    if (windRef.current) {
      windRef.current.visible = active && fxType === "wind";
      if (windRef.current.visible) {
        const span = model.canopyRadius * 2.8 + 1;
        windRef.current.children.forEach((child, i) => {
          const seed = dropSeeds[i];
          // Each leaf sweeps across in a loose arc, tumbling as it goes.
          const k = reducedMotion ? 0.5 : (elapsed * 0.7 + seed.phase) % 1;
          child.position.set(
            -span / 2 + k * span,
            top * (0.4 + seed.phase * 0.7) + Math.sin(k * Math.PI * 2 + i) * 0.35,
            seed.z * 0.8 + Math.cos(k * Math.PI + i) * 0.4
          );
          child.rotation.set(reducedMotion ? 0 : t * 5 + i, reducedMotion ? 0 : t * 3 + i * 2, 0);
        });
      }
    }

    if (markerRef.current) {
      markerRef.current.position.y = model.height + 0.6 + (reducedMotion ? 0 : Math.floor(Math.sin(t * 3) * 2) * 0.06);
      markerRef.current.rotation.y = reducedMotion ? 0 : Math.floor(t * 4) * (Math.PI / 4);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag that happens to end on a tree must not select it.
    if (e.delta > TAP_MAX_TRAVEL_PX) return;
    onTap(thought);
  };

  const lightColor = near || isSelected ? lightColors.nearColor : lightColors.color;

  return (
    <group
      position={[x, y, z]}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (e.pointerType !== "mouse") return;
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setIsHovered(false);
        document.body.style.cursor = "";
      }}
    >
      {/* Generous invisible hit area so small stages are still easy to tap. */}
      <mesh
        geometry={HIT_GEOMETRY}
        material={hitMaterial}
        position={[0, Math.max(1.2, model.height) / 2, 0]}
        scale={[Math.max(1.1, footprint), Math.max(1.2, model.height), Math.max(1.1, footprint)]}
      />

      {/* Pixel blob shadow instead of real-time shadow maps (spec 17.7). */}
      <mesh
        geometry={SHADOW_GEOMETRY}
        material={shadowMaterial}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[footprint * 1.05, footprint * 1.05, 1]}
      />

      {isSelected && (
        <mesh
          geometry={RING_GEOMETRY}
          material={selectRingMaterial}
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[footprint * 1.7, footprint * 1.7, 1]}
        />
      )}
      {(isSelected || near) && (
        <mesh
          ref={markerRef}
          geometry={MARKER_GEOMETRY}
          material={isSelected ? toonMaterial(PALETTE.amber) : glowMaterial(lightColors.nearColor)}
          scale={isSelected ? 1 : 0.6}
        />
      )}
      {isHovered && !isSelected && (
        <mesh
          geometry={RING_GEOMETRY}
          material={hoverRingMaterial}
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[footprint * 1.5, footprint * 1.5, 1]}
        />
      )}

      <group ref={rootRef}>
        <group ref={swayRef} scale={[fullness, 1, fullness]}>
          {model.parts.map((part, i) => (
            <mesh
              key={i}
              geometry={GEOMETRIES[part.shape]}
              material={toonMaterial(bright && part.sways ? brighten(part.color) : part.color, {
                flat: true,
                dither: dithered && part.sways,
              })}
              position={part.position}
              rotation={part.rotation}
              scale={part.scale}
            />
          ))}
          <group ref={lightsRef}>
            {model.lightAnchors.slice(0, lightCount).map((p, i) => (
              <mesh key={i} geometry={POINT_GEOMETRY} material={glowMaterial(lightColor)} position={p} scale={pointScale} />
            ))}
          </group>
        </group>
        <group ref={dropsRef} visible={false}>
          {dropSeeds.map((_, i) => (
            <mesh key={i} geometry={DROP_GEOMETRY} material={glowMaterial(PALETTE.water)} />
          ))}
        </group>
        <group ref={sunRef} visible={false}>
          <mesh geometry={SUN_GEOMETRY} material={glowMaterial(PALETTE.flowerYellow)} />
          {Array.from({ length: RAY_COUNT }, (_, i) => {
            const a = (i / RAY_COUNT) * Math.PI * 2;
            return (
              <mesh
                key={i}
                geometry={RAY_GEOMETRY}
                material={glowMaterial(PALETTE.amber)}
                position={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]}
                rotation={[0, 0, a - Math.PI / 2]}
              />
            );
          })}
        </group>
        <group ref={windRef} visible={false}>
          {Array.from({ length: FLAKE_COUNT }, (_, i) => (
            <mesh
              key={i}
              geometry={FLAKE_GEOMETRY}
              material={toonMaterial(i % 3 === 0 ? PALETTE.leafSun : i % 3 === 1 ? PALETTE.leafLight : PALETTE.leafMid)}
            />
          ))}
        </group>
      </group>
    </group>
  );
}
