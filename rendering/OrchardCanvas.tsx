"use client";
/* eslint-disable react-hooks/immutability -- gesture handlers write to the shared movement
   ref, which the render loop reads every frame; it is never used for React rendering. */

import React, { Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { hasWebGL, useWebGLRecovery } from "@/lib/webgl";
import { Canvas } from "@react-three/fiber";
import { Thought } from "@/types/thought";
import { GrowthState } from "@/features/growth/growthModel";
import { BOUNDARY_INSET, CircleCollider, TRUNK_CLEARANCE } from "@/features/world/collision";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Ground } from "@/rendering/environment/Ground";
import { Atmosphere } from "@/rendering/scene/Atmosphere";
import { ATMOSPHERES, TimeOfDay } from "@/rendering/scene/atmospheres";
import { CareFx, ProceduralTree, TAP_MAX_TRAVEL_PX } from "@/rendering/trees/ProceduralTree";
import { getTreeModel } from "@/rendering/trees/treeIdentity";
import { aimAtTree, frameInExplorer, isNarrowScreen } from "@/rendering/movement/aim";
import { usePixelRatio } from "@/rendering/pixel/usePixelRatio";
import { Navigator } from "@/rendering/movement/Navigator";
import { ExplorerCharacter } from "@/rendering/explorer/ExplorerCharacter";
import {
  EXPLORER_DISTANCE,
  ExplorerState,
  PITCH_MAX,
  PITCH_MIN,
  ViewMode,
} from "@/rendering/movement/explorerState";

export interface TreeEntry {
  thought: Thought;
  growth: GrowthState;
}

interface OrchardCanvasProps {
  trees: TreeEntry[];
  openRegionIds: string[];
  selectedId: string | null;
  onSelect: (thought: Thought | null) => void;
  explorer: React.RefObject<ExplorerState>;
  view: ViewMode;
  careFx: Record<string, CareFx>;
  timeOfDay: TimeOfDay;
  /** False while a dialog is open, so keys type into it instead of walking. */
  controlsEnabled: boolean;
  onFirstInteraction?: () => void;
}

/** Within this distance in the Immersive view, tapping a tree just turns to face it (spec 20.2). */
const FACE_WITHOUT_WALKING = 12;
const READ_DISTANCE: Record<ViewMode, number> = { immersive: 3, explorer: 2.5 };
const LOOK_SPEED = 0.005;

const KEY_MAP: Record<string, string> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  KeyD: "right",
  ArrowLeft: "turnLeft",
  KeyQ: "turnLeft",
  ArrowRight: "turnRight",
  KeyE: "turnRight",
};

function WebGLFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="px-parchment max-w-sm p-5 text-center">
        <h2 className="mb-2 text-lg">The orchard can&apos;t be drawn here</h2>
        <p className="text-sm leading-relaxed">
          This device doesn&apos;t support 3D graphics (WebGL). All of your thoughts are still in the Notebook at the
          bottom of the screen.
        </p>
      </div>
    </div>
  );
}

function subscribe() {
  return () => {};
}

function isTyping(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

export function OrchardCanvas({
  trees,
  openRegionIds,
  selectedId,
  onSelect,
  explorer,
  view,
  careFx,
  timeOfDay,
  controlsEnabled,
  onFirstInteraction,
}: OrchardCanvasProps) {
  const webgl = useSyncExternalStore(subscribe, hasWebGL, () => true);
  const recovery = useWebGLRecovery();
  const dpr = usePixelRatio();
  const reducedMotion = usePrefersReducedMotion();
  const atmosphere = ATMOSPHERES[timeOfDay];

  const pointers = useRef(new Map<number, { x: number; y: number; button: number }>());
  const gesture = useRef({ travel: 0, downX: 0, downY: 0, pinchDist: 0, pinchAngle: 0 });

  const trunks: CircleCollider[] = useMemo(
    () =>
      trees.map(({ thought, growth }) => ({
        x: thought.position.x,
        z: thought.position.z,
        r: getTreeModel(thought, growth.stage).trunkRadius + TRUNK_CLEARANCE,
      })),
    [trees]
  );
  const walkable: CircleCollider[] = useMemo(
    () =>
      WORLD_LAYOUT.regions
        .filter((r) => openRegionIds.includes(r.id))
        .map((r) => ({ x: r.center.x, z: r.center.z, r: r.radius - BOUNDARY_INSET })),
    [openRegionIds]
  );

  // Keyboard walking (spec 20.2, 20.3). Off while typing or while a dialog is open.
  useEffect(() => {
    const keys = explorer.current.keys;
    const down = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (!action || !controlsEnabled || isTyping() || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      keys.add(action);
      onFirstInteraction?.();
    };
    const up = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (action) keys.delete(action);
    };
    const clear = () => keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    if (!controlsEnabled) keys.clear();
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [explorer, controlsEnabled, onFirstInteraction]);

  if (!webgl) return <WebGLFallback />;

  const handleTreeTap = (thought: Thought) => {
    const entry = trees.find((t) => t.thought._id === thought._id);
    if (!entry) return;
    const ex = explorer.current;
    const model = getTreeModel(thought, entry.growth.stage);
    const tree = thought.position;
    const distance = Math.hypot(tree.x - ex.x, tree.z - ex.z);
    const open = () => {
      if (view === "immersive") aimAtTree(ex, thought, entry.growth.stage, isNarrowScreen());
      else frameInExplorer(ex, tree, isNarrowScreen());
      onSelect(thought);
    };

    if (view === "immersive" && distance <= FACE_WITHOUT_WALKING) {
      ex.target = null;
      open();
      return;
    }
    const stop = READ_DISTANCE[view] + model.trunkRadius;
    if (distance <= stop + 0.1) {
      open();
      return;
    }
    ex.target = { point: tree, stopDistance: stop, onArrive: open };
  };

  const handleGroundTap = (point: { x: number; z: number }) => {
    onSelect(null);
    explorer.current.target = { point, stopDistance: 0.1 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
    const g = gesture.current;
    if (pointers.current.size === 1) {
      g.travel = 0;
      g.downX = e.clientX;
      g.downY = e.clientY;
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      g.pinchAngle = Math.atan2(b.y - a.y, b.x - a.x);
    }
    onFirstInteraction?.();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const ex = explorer.current;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (view === "explorer" && g.pinchDist > 0) {
        ex.explorerDistance = Math.min(
          EXPLORER_DISTANCE.max,
          Math.max(EXPLORER_DISTANCE.min, (ex.explorerDistance * g.pinchDist) / dist)
        );
        ex.explorerYaw += angle - g.pinchAngle;
      }
      g.pinchDist = dist;
      g.pinchAngle = angle;
      g.travel = Infinity;
      return;
    }

    g.travel = Math.max(g.travel, Math.hypot(e.clientX - g.downX, e.clientY - g.downY));
    if (g.travel <= TAP_MAX_TRAVEL_PX) return;

    if (view === "immersive") {
      // Drag to look: grab the world and turn it.
      ex.heading += dx * LOOK_SPEED;
      ex.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, ex.pitch + dy * LOOK_SPEED));
      ex.faceHeading = null;
    } else if (prev.button === 2) {
      ex.explorerYaw += dx * LOOK_SPEED;
    } else {
      // Look around; springs back when the explorer walks again (spec 20.3).
      const k = ex.explorerDistance * 0.0025;
      const s = Math.sin(ex.explorerYaw);
      const c = Math.cos(ex.explorerYaw);
      ex.lookOffset.x -= (dx * c + dy * s) * k;
      ex.lookOffset.z -= (-dx * s + dy * c) * k;
      const len = Math.hypot(ex.lookOffset.x, ex.lookOffset.z);
      if (len > 12) {
        ex.lookOffset.x *= 12 / len;
        ex.lookOffset.z *= 12 / len;
      }
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (view !== "explorer") return;
    const ex = explorer.current;
    ex.explorerDistance = Math.min(
      EXPLORER_DISTANCE.max,
      Math.max(EXPLORER_DISTANCE.min, ex.explorerDistance * (1 + e.deltaY * 0.001))
    );
  };

  return (
    <div
      className="pixel-canvas px-sky-bands relative h-full w-full touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={null}>
        <Canvas
          key={recovery.canvasKey}
          dpr={dpr}
          flat
          gl={{ antialias: false, powerPreference: "low-power" }}
          camera={{ fov: 55, near: 0.1, far: 220 }}
          // While the GPU is giving the context back, show the sky, never a blank canvas.
          style={{ visibility: recovery.lost ? "hidden" : "visible" }}
          onCreated={({ gl }) => recovery.attach(gl.domElement)}
        >
          <Atmosphere timeOfDay={timeOfDay} dpr={dpr} reducedMotion={reducedMotion} openRegionIds={openRegionIds} />
          <Ground openRegionIds={openRegionIds} onGroundTap={handleGroundTap} tapMaxTravelPx={TAP_MAX_TRAVEL_PX} />
          {trees.map(({ thought, growth }) => (
            <ProceduralTree
              key={thought._id}
              thought={thought}
              growth={growth}
              isSelected={selectedId === thought._id}
              explorer={explorer}
              view={view}
              careFx={careFx[thought._id] ?? null}
              lightColors={atmosphere.treeLight}
              reducedMotion={reducedMotion}
              onTap={handleTreeTap}
            />
          ))}
          <ExplorerCharacter state={explorer} visible={view === "explorer"} reducedMotion={reducedMotion} />
          <Navigator state={explorer} view={view} trunks={trunks} walkable={walkable} reducedMotion={reducedMotion} />
        </Canvas>
      </Suspense>
      {recovery.lost && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <p role="status" className="px-parchment px-4 py-3 text-base">
            The forest is catching its breath…
          </p>
        </div>
      )}
    </div>
  );
}
