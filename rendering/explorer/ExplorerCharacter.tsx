"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { toonMaterial } from "@/rendering/pixel/toonMaterials";
import { getTerrainHeight } from "@/rendering/environment/terrain";
import { ExplorerState } from "@/rendering/movement/explorerState";

/**
 * The explorer (spec 20.3, OD-27): a 1.6 m figure built from boxes, like the
 * trees, in the green tunic from reference 12. Only visible in Explorer view.
 * Walking swings the legs and arms in stepped frames.
 */

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SHADOW = new THREE.CircleGeometry(0.42, 10);
const SHADOW_MATERIAL = new THREE.MeshBasicMaterial({ color: "#3f2a1c", transparent: true, opacity: 0.45, depthWrite: false });
const COLORS = {
  skin: "#e2b48c",
  hair: "#6b3f22",
  tunic: "#4f8a3a",
  belt: "#5e3f28",
  trousers: "#5b4a3a",
  boots: "#3f2a1c",
};

function Part({
  color,
  position,
  scale,
}: {
  color: string;
  position: [number, number, number];
  scale: [number, number, number];
}) {
  return <mesh geometry={BOX} material={toonMaterial(color, { flat: true })} position={position} scale={scale} />;
}

export function ExplorerCharacter({
  state: stateRef,
  visible,
  reducedMotion,
}: {
  state: React.RefObject<ExplorerState>;
  visible: boolean;
  reducedMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame((s) => {
    if (!root.current) return;
    const state = stateRef.current;
    root.current.position.set(state.x, getTerrainHeight(state.x, state.z), state.z);
    root.current.rotation.y = state.heading;
    // Four stepped frames per stride.
    const frame = state.moving && !reducedMotion ? Math.floor(s.clock.getElapsedTime() * 8) % 4 : 0;
    const swing = [0, 0.5, 0, -0.5][frame];
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.8;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.8;
  });

  // Facing −z (north) at heading 0, matching the camera's forward.
  return (
    <group ref={root} visible={visible}>
      {/* Ground shadow so the explorer reads clearly from above. */}
      <mesh geometry={SHADOW} material={SHADOW_MATERIAL} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <group ref={leftLeg} position={[-0.1, 0.72, 0]}>
        <Part color={COLORS.trousers} position={[0, -0.32, 0]} scale={[0.15, 0.6, 0.17]} />
        <Part color={COLORS.boots} position={[0, -0.66, -0.03]} scale={[0.16, 0.12, 0.24]} />
      </group>
      <group ref={rightLeg} position={[0.1, 0.72, 0]}>
        <Part color={COLORS.trousers} position={[0, -0.32, 0]} scale={[0.15, 0.6, 0.17]} />
        <Part color={COLORS.boots} position={[0, -0.66, -0.03]} scale={[0.16, 0.12, 0.24]} />
      </group>
      <Part color={COLORS.tunic} position={[0, 0.98, 0]} scale={[0.4, 0.5, 0.24]} />
      <Part color={COLORS.belt} position={[0, 0.76, 0]} scale={[0.42, 0.07, 0.26]} />
      <group ref={leftArm} position={[-0.26, 1.18, 0]}>
        <Part color={COLORS.tunic} position={[0, -0.2, 0]} scale={[0.11, 0.42, 0.13]} />
        <Part color={COLORS.skin} position={[0, -0.44, 0]} scale={[0.1, 0.09, 0.1]} />
      </group>
      <group ref={rightArm} position={[0.26, 1.18, 0]}>
        <Part color={COLORS.tunic} position={[0, -0.2, 0]} scale={[0.11, 0.42, 0.13]} />
        <Part color={COLORS.skin} position={[0, -0.44, 0]} scale={[0.1, 0.09, 0.1]} />
      </group>
      <Part color={COLORS.skin} position={[0, 1.37, 0]} scale={[0.26, 0.26, 0.24]} />
      <Part color={COLORS.hair} position={[0, 1.5, 0.02]} scale={[0.29, 0.12, 0.28]} />
      <Part color={COLORS.hair} position={[0, 1.4, 0.1]} scale={[0.28, 0.2, 0.08]} />
    </group>
  );
}
