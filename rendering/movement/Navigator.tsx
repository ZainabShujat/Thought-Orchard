"use client";
/* eslint-disable react-hooks/immutability -- three.js render loop: the camera and the shared
   movement ref are mutated every frame by design; nothing here feeds React rendering. */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CircleCollider, resolveMove } from "@/features/world/collision";
import { getTerrainHeight } from "@/rendering/environment/terrain";
import {
  EXPLORER_PITCH,
  EYE_HEIGHT,
  ExplorerState,
  SPEEDS,
  ViewMode,
  angleDelta,
  forward,
  headingTo,
} from "@/rendering/movement/explorerState";

/** Field of view per view (spec 20.2, 20.3). */
const FOV: Record<ViewMode, number> = { immersive: 55, explorer: 35 };
/**
 * Near clipping plane per view. The Explorer camera sits 18–40 m from the
 * explorer, above the forest; clipping the first metres stops treetops right
 * under the camera from filling the frame (the explorer is always far beyond).
 */
// At the closest Explorer distance (18 m, 55° down) the nearest visible ground is ~15 m away.
const NEAR: Record<ViewMode, number> = { immersive: 0.1, explorer: 12 };
/** View switches and jumps play as a short stepped move (spec 20.4). */
const TRANSITION_SECONDS = 0.5;
const TRANSITION_STEPS = 5;
const TURN_RATE_KEYS = 1.8;
const TURN_RATE_WALK = 2.5;
const TURN_RATE_FACE = 4;
const UP = new THREE.Vector3(0, 1, 0);

interface NavigatorProps {
  state: React.RefObject<ExplorerState>;
  view: ViewMode;
  trunks: CircleCollider[];
  walkable: CircleCollider[];
  reducedMotion: boolean;
}

interface Transition {
  fromPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  fromFov: number;
  t: number;
}

/**
 * Moves the explorer (keys or a walk target, with collision and terrain
 * following) and places the camera for the current view. Runs every frame.
 */
export function Navigator({ state: stateRef, view, trunks, walkable, reducedMotion }: NavigatorProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const transition = useRef<Transition | null>(null);
  const lastView = useRef<ViewMode>(view);
  const lastDesired = useRef<THREE.Vector3 | null>(null);
  const blocked = useRef(0);
  const scratch = useRef({
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    euler: new THREE.Euler(),
    look: new THREE.Matrix4(),
    target: new THREE.Vector3(),
  });

  useEffect(() => {
    camera.near = 0.1;
    camera.far = 220;
    camera.rotation.order = "YXZ";
  }, [camera]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const state = stateRef.current;

    // ---- Movement ----
    const keys = state.keys;
    const anyKey = keys.size > 0;
    const step = SPEEDS[state.mode] * dt;
    let moveX = 0;
    let moveZ = 0;

    if (anyKey) {
      state.target = null;
      if (view === "immersive") {
        if (keys.has("turnLeft")) state.heading += TURN_RATE_KEYS * dt;
        if (keys.has("turnRight")) state.heading -= TURN_RATE_KEYS * dt;
        const f = forward(state.heading);
        const r = { x: -f.z, z: f.x };
        const fwd = (keys.has("forward") ? 1 : 0) - (keys.has("back") ? 1 : 0);
        const side = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
        moveX = f.x * fwd + r.x * side;
        moveZ = f.z * fwd + r.z * side;
      } else {
        // Explorer: keys move relative to the screen.
        if (keys.has("turnLeft")) state.explorerYaw += TURN_RATE_KEYS * dt;
        if (keys.has("turnRight")) state.explorerYaw -= TURN_RATE_KEYS * dt;
        const f = forward(state.explorerYaw);
        const r = { x: -f.z, z: f.x };
        const fwd = (keys.has("forward") ? 1 : 0) - (keys.has("back") ? 1 : 0);
        const side = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
        moveX = f.x * fwd + r.x * side;
        moveZ = f.z * fwd + r.z * side;
        if (moveX !== 0 || moveZ !== 0) {
          state.heading += angleDelta(state.heading, headingTo({ x: 0, z: 0 }, { x: moveX, z: moveZ })) * Math.min(1, dt * 10);
        }
      }
    } else if (state.target) {
      const { point, stopDistance, onArrive } = state.target;
      const dx = point.x - state.x;
      const dz = point.z - state.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= stopDistance + 0.05) {
        state.target = null;
        blocked.current = 0;
        onArrive?.();
      } else {
        moveX = dx / dist;
        moveZ = dz / dist;
        const turnRate = view === "immersive" ? TURN_RATE_WALK : TURN_RATE_FACE * 2;
        const want = headingTo(state, point);
        state.heading += Math.max(-turnRate * dt, Math.min(turnRate * dt, angleDelta(state.heading, want)));
      }
    }

    if (state.faceHeading !== null) {
      const d = angleDelta(state.heading, state.faceHeading);
      if (Math.abs(d) < 0.01 || reducedMotion) {
        state.heading = state.faceHeading;
        state.faceHeading = null;
      } else {
        state.heading += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE_FACE * dt);
      }
    }

    const len = Math.hypot(moveX, moveZ);
    state.moving = len > 0;
    if (len > 0) {
      const to = { x: state.x + (moveX / len) * step, z: state.z + (moveZ / len) * step };
      const before = { x: state.x, z: state.z };
      const after = resolveMove(before, to, trunks, walkable);
      const progressed = Math.hypot(after.x - before.x, after.z - before.z);
      state.x = after.x;
      state.z = after.z;

      // A walk that can't make progress ends instead of pushing forever.
      if (state.target && progressed < step * 0.1) {
        blocked.current += dt;
        if (blocked.current > 0.6) {
          const arrive = state.target.onArrive;
          state.target = null;
          blocked.current = 0;
          arrive?.();
        }
      } else {
        blocked.current = 0;
      }

      // Look-around in Explorer view eases back once the explorer moves.
      state.lookOffset.x *= Math.max(0, 1 - dt * 3);
      state.lookOffset.z *= Math.max(0, 1 - dt * 3);
    }

    // ---- Camera ----
    const { pos, quat, euler, look, target } = scratch.current;
    const ground = getTerrainHeight(state.x, state.z);
    if (view === "immersive") {
      pos.set(state.x, ground + EYE_HEIGHT, state.z);
      quat.setFromEuler(euler.set(state.pitch, state.heading, 0, "YXZ"));
    } else {
      const tx = state.x + state.lookOffset.x;
      const tz = state.z + state.lookOffset.z;
      const ty = getTerrainHeight(tx, tz) + 1;
      const d = state.explorerDistance;
      const horizontal = Math.cos(EXPLORER_PITCH) * d;
      pos.set(
        tx + Math.sin(state.explorerYaw) * horizontal,
        ty + Math.sin(EXPLORER_PITCH) * d,
        tz + Math.cos(state.explorerYaw) * horizontal
      );
      // Matrix4.lookAt uses the camera convention (looking down −Z).
      look.lookAt(pos, target.set(tx, ty, tz), UP);
      quat.setFromRotationMatrix(look);
    }
    const fov = FOV[view];

    // Start a stepped transition when the view changes or the pose jumps.
    const jumped = lastDesired.current !== null && lastDesired.current.distanceTo(pos) > 3;
    if ((view !== lastView.current || jumped) && !reducedMotion) {
      transition.current = {
        fromPos: camera.position.clone(),
        fromQuat: camera.quaternion.clone(),
        fromFov: camera.fov,
        t: 0,
      };
    }
    lastView.current = view;
    lastDesired.current = (lastDesired.current ?? new THREE.Vector3()).copy(pos);

    const tr = transition.current;
    if (tr) {
      tr.t += dt / TRANSITION_SECONDS;
      const s = Math.min(1, Math.ceil(tr.t * TRANSITION_STEPS) / TRANSITION_STEPS);
      camera.position.lerpVectors(tr.fromPos, pos, s);
      camera.quaternion.slerpQuaternions(tr.fromQuat, quat, s);
      camera.fov = tr.fromFov + (fov - tr.fromFov) * s;
      if (s >= 1) transition.current = null;
    } else {
      camera.position.copy(pos);
      camera.quaternion.copy(quat);
      camera.fov = fov;
    }
    camera.near = transition.current ? Math.min(NEAR.immersive, NEAR[view]) : NEAR[view];
    camera.updateProjectionMatrix();
  });

  return null;
}
