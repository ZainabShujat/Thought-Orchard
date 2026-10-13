"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "@/lib/random";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";
import { getTerrainHeight } from "@/rendering/environment/terrain";
import { ATMOSPHERES, TimeOfDay } from "@/rendering/scene/atmospheres";

interface AtmosphereProps {
  timeOfDay: TimeOfDay;
  /** Renderer pixel ratio; keeps motes and fireflies one render pixel wide. */
  dpr: number;
  reducedMotion: boolean;
  openRegionIds: string[];
}

/** A sky dome painted in hard horizontal bands (pixel-art sky). */
export function SkyDome({ bands }: { bands: string[] }) {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(140, 24, 16);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const palette = bands.map((c) => new THREE.Color(c));
    for (let i = 0; i < pos.count; i++) {
      const h = Math.max(0, pos.getY(i) / 140); // 0 at horizon, 1 overhead
      const band = Math.min(palette.length - 1, Math.floor(Math.pow(h, 0.6) * palette.length));
      colors.set([palette[band].r, palette[band].g, palette[band].b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [bands]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function scatterInOpenRegions(seed: number, count: number, openIds: string[], yMin: number, yMax: number) {
  const regions = WORLD_LAYOUT.regions.filter((r) => openIds.includes(r.id));
  const rng = createRng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const region = regions[i % regions.length];
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * region.radius;
    const x = region.center.x + Math.cos(a) * r;
    const z = region.center.z + Math.sin(a) * r;
    pos.set([x, getTerrainHeight(x, z) + yMin + rng() * (yMax - yMin), z], i * 3);
  }
  return pos;
}

/**
 * Drifting points. Fireflies blink in stepped frames by splitting into two
 * sets that take turns; under reduced motion they hold still.
 */
export function Drifters({
  positions,
  color,
  size,
  blink,
  reducedMotion,
}: {
  positions: Float32Array;
  color: string;
  size: number;
  blink: boolean;
  reducedMotion: boolean;
}) {
  const half = Math.floor(positions.length / 6) * 3;
  const sets = useMemo(
    () => (blink ? [positions.slice(0, half), positions.slice(half)] : [positions.slice()]),
    [positions, half, blink]
  );
  const refs = useRef<(THREE.Object3D | null)[]>([]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    refs.current.forEach((object, setIndex) => {
      const points = object as THREE.Points | null;
      if (!points) return;
      if (blink) points.visible = Math.floor(t / 0.7) % 2 === setIndex;
      const attr = points.geometry.attributes.position as THREE.BufferAttribute;
      const base = sets[setIndex];
      for (let i = 0; i < attr.count; i++) {
        attr.setX(i, base[i * 3] + Math.cos(t * 0.3 + i * 0.7) * 0.5);
        attr.setY(i, base[i * 3 + 1] + Math.sin(t * 0.5 + i) * 0.25);
        attr.setZ(i, base[i * 3 + 2] + Math.sin(t * 0.35 + i * 0.4) * 0.5);
      }
      attr.needsUpdate = true;
    });
  });

  return (
    <>
      {sets.map((set, i) => (
        <points key={i} ref={(el) => void (refs.current[i] = el)}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[set.slice(), 3]} />
          </bufferGeometry>
          <pointsMaterial size={size} sizeAttenuation={false} color={color} fog={false} />
        </points>
      ))}
    </>
  );
}

export function Atmosphere({ timeOfDay, dpr, reducedMotion, openRegionIds }: AtmosphereProps) {
  const preset = ATMOSPHERES[timeOfDay];
  const openKey = openRegionIds.join(",");
  const fireflies = useMemo(
    () => scatterInOpenRegions(421, preset.fireflies.count, openKey.split(","), 0.3, 3),
    [preset.fireflies.count, openKey]
  );
  const motes = useMemo(
    () => scatterInOpenRegions(99, preset.motes.count, openKey.split(","), 1, 9),
    [preset.motes.count, openKey]
  );

  return (
    <>
      <color attach="background" args={[preset.fog.color]} />
      <fog attach="fog" args={[preset.fog.color, preset.fog.near, preset.fog.far]} />
      <SkyDome bands={preset.skyBands} />

      <hemisphereLight args={[preset.hemisphere.sky, preset.hemisphere.ground, preset.hemisphere.intensity]} />
      <directionalLight position={preset.sun.position} intensity={preset.sun.intensity} color={preset.sun.color} />

      {/* Point size is multiplied by the pixel ratio, so 1/dpr is one render pixel. */}
      <Drifters positions={fireflies} color={preset.fireflies.color} size={1 / dpr} blink reducedMotion={reducedMotion} />
      <Drifters positions={motes} color={preset.motes.color} size={1 / dpr} blink={false} reducedMotion={reducedMotion} />
    </>
  );
}
