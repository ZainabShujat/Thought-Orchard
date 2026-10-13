"use client";

import React, { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { hasWebGL, useWebGLRecovery } from "@/lib/webgl";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { createRng, pick, range } from "@/lib/random";
import { PALETTE } from "@/rendering/pixel/palette";
import { glowMaterial, toonMaterial } from "@/rendering/pixel/toonMaterials";
import { usePixelRatio } from "@/rendering/pixel/usePixelRatio";
import { generateTree, PartShape } from "@/rendering/trees/treeGenerator";
import { Drifters, SkyDome } from "@/rendering/scene/Atmosphere";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * The entrance view (spec 22.1; references 07, 08): a path leading into a
 * misty broadleaf wood, to one glowing thought-tree in a clearing, with light
 * falling from above and fireflies in the undergrowth. Built in code and drawn
 * through the same pixel pipeline as the orchard; no painted background.
 */

// Seed chosen for sunlit leaves and a wide, rounded canopy, like the references.
const HERO = { x: -0.4, z: -6, seed: 299 };
const PATH: [number, number][] = [
  [0.4, 16], [0.1, 10], [-0.2, 5], [0.4, 0], [1.9, -3.6], [3.4, -7.5], [4.4, -13], [4.2, -22], [5, -40],
];
const FOG = "#cbd7a9";

function distToPath(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i];
    const [bx, bz] = PATH[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

const height = (x: number, z: number) => Math.sin(x * 0.18) * Math.cos(z * 0.14) * 0.35 + Math.max(0, Math.abs(x) - 8) * 0.06;

function buildGround(): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(90, 90, 90, 90);
  plane.rotateX(-Math.PI / 2);
  const geo = plane.toNonIndexed();
  plane.dispose();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));

  const rng = createRng(77);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const dirt = [PALETTE.dirt, PALETTE.dirtLight, PALETTE.soil];
  const clearing = [PALETTE.leafLight, PALETTE.leafSun, PALETTE.leafLight, PALETTE.leafMid];
  const grass = [PALETTE.leafMid, PALETTE.leafDark, PALETTE.leafMid, PALETTE.leafDeep];
  for (let tri = 0; tri < pos.count; tri += 3) {
    const cx = (pos.getX(tri) + pos.getX(tri + 1) + pos.getX(tri + 2)) / 3;
    const cz = (pos.getZ(tri) + pos.getZ(tri + 1) + pos.getZ(tri + 2)) / 3;
    const d = distToPath(cx, cz);
    const fromTree = Math.hypot(cx - HERO.x, cz - HERO.z);
    if (d < 1.15) c.set(d < 0.6 ? pick(rng, dirt.slice(0, 2)) : pick(rng, dirt));
    else if (fromTree < 5.5) c.set(pick(rng, clearing));
    else c.set(pick(rng, grass));
    for (let v = 0; v < 3; v++) colors.set([c.r, c.g, c.b], (tri + v) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

interface Batch {
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
}
const batch = (): Batch => ({ matrices: [], colors: [] });
function push(b: Batch, o: THREE.Object3D, color: string) {
  o.updateMatrix();
  b.matrices.push(o.matrix.clone());
  b.colors.push(new THREE.Color(color));
}

/** Tall broadleaf woods on both sides, a framing trunk at each edge, and dense undergrowth. */
function buildWoods() {
  const rng = createRng(4242);
  const o = new THREE.Object3D();
  const trunks = batch();
  const crowns = batch();
  const bushes = batch();
  const flowers = batch();

  const tree = (x: number, z: number, h: number) => {
    const trunkH = h * range(rng, 0.5, 0.62);
    o.position.set(x, height(x, z) + trunkH / 2, z);
    o.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.06);
    const w = range(rng, 0.35, 0.55) * (h / 10);
    o.scale.set(w, trunkH, w);
    push(trunks, o, pick(rng, [PALETTE.barkDark, PALETTE.bark]));
    const r = h * range(rng, 0.22, 0.3);
    for (let c = 0; c < 3; c++) {
      const a = rng() * Math.PI * 2;
      const off = c === 0 ? 0 : r * range(rng, 0.5, 0.8);
      const cr = c === 0 ? r : r * range(rng, 0.6, 0.85);
      o.position.set(x + Math.cos(a) * off, height(x, z) + trunkH + cr * 0.6, z + Math.sin(a) * off);
      o.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      o.scale.set(cr, cr * 0.85, cr);
      push(crowns, o, pick(rng, [PALETTE.leafDeep, PALETTE.leafDark, PALETTE.leafMid]));
    }
  };

  for (let i = 0; i < 900 && trunks.matrices.length < 320; i++) {
    const side = rng() < 0.5 ? -1 : 1;
    const x = side * range(rng, 4.2, 26);
    const z = range(rng, -48, 6);
    if (distToPath(x, z) < 2.6) continue;
    if (Math.hypot(x - HERO.x, z - HERO.z) < 7) continue;
    tree(x, z, range(rng, 9, 14));
  }
  // Big framing trunks near the camera, left and right (as in the references).
  tree(-6.2, 6.5, 15);
  tree(6.8, 5, 15);
  tree(-8.5, 1, 14);
  tree(8.8, -0.5, 14);

  for (let i = 0; i < 2000 && bushes.matrices.length < 480; i++) {
    const x = range(rng, -14, 14);
    const z = range(rng, -22, 9);
    const d = distToPath(x, z);
    if (d < 1.6) continue;
    // Keep the path and the clearing open so the eye travels to the tree.
    if (Math.hypot(x - HERO.x, z - HERO.z) < 4.2) continue;
    if (z > 2 && Math.abs(x) < 2.4) continue;
    const nearPath = d < 4;
    const foreground = z > 3;
    if (!nearPath && !foreground && rng() < 0.7) continue;
    const s = range(rng, 0.3, 0.6) * (foreground ? range(rng, 1, 1.35) : 1);
    o.position.set(x, height(x, z) + s * 0.45, z);
    o.rotation.set(rng(), rng() * Math.PI, rng());
    o.scale.set(s * 1.3, s * 0.9, s * 1.3);
    push(bushes, o, pick(rng, [PALETTE.leafDeep, PALETTE.leafDark, PALETTE.leafDark, PALETTE.leafMid]));
    if (rng() < 0.3) {
      o.position.y += s * 0.75;
      o.position.x += (rng() - 0.5) * s;
      o.rotation.set(0, rng(), 0);
      o.scale.setScalar(0.16);
      push(flowers, o, pick(rng, [PALETTE.blossomPink, PALETTE.flowerViolet, PALETTE.blossomWhite]));
    }
  }
  return { trunks, crowns, bushes, flowers };
}

function Instanced({ geometry, data }: { geometry: THREE.BufferGeometry; data: Batch }) {
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
  return <instancedMesh ref={ref} args={[geometry, material, data.matrices.length]} />;
}

const SHAPES: Record<PartShape, THREE.BufferGeometry> = {
  trunk: new THREE.CylinderGeometry(0.7, 1, 1, 6),
  leaf: new THREE.IcosahedronGeometry(1, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
  mound: new THREE.SphereGeometry(1, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2),
};
const LIGHT = new THREE.BoxGeometry(0.22, 0.22, 0.22);

/** The glowing thought-tree in the clearing. */
function HeroTree({ reducedMotion }: { reducedMotion: boolean }) {
  const model = useMemo(() => generateTree("flourishing", HERO.seed), []);
  const sway = useRef<THREE.Group>(null);
  const lights = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sway.current && !reducedMotion) sway.current.rotation.z = Math.sin(t * 1.1) * 0.01;
    if (lights.current) {
      const frame = reducedMotion ? 0 : Math.floor(t * 2);
      lights.current.children.forEach((c, i) => (c.visible = reducedMotion || (frame + i * 3) % 7 !== 0));
    }
  });
  return (
    <group position={[HERO.x, height(HERO.x, HERO.z), HERO.z]} scale={1.45}>
      {/* The tree is lit from within by its thoughts. */}
      <pointLight position={[0, 4.5, 1.5]} intensity={6} distance={9} decay={1.5} color="#ffe2a0" />
      <group ref={sway}>
        {model.parts.map((p, i) => (
          <mesh
            key={i}
            geometry={SHAPES[p.shape]}
            material={toonMaterial(p.color, { flat: true })}
            position={p.position}
            rotation={p.rotation}
            scale={p.scale}
          />
        ))}
        <group ref={lights}>
          {model.lightAnchors.map((a, i) => (
            <mesh key={i} geometry={LIGHT} material={glowMaterial(i % 3 === 0 ? "#fff2b8" : "#ffd56a")} position={a} />
          ))}
        </group>
      </group>
    </group>
  );
}

/** Soft vertical bands of light falling through the canopy (pixel-style "god rays"). */
function LightShafts() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#fff6cf",
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const shafts: [number, number, number, number, number][] = [
    [-1.2, 9, -12, 3.2, 0.12],
    [1.6, 10, -16, 4.5, -0.1],
    [-0.2, 11, -22, 6, 0.05],
    [3.5, 9, -11, 2.2, -0.2],
  ];
  return (
    <>
      {shafts.map(([x, y, z, w, tilt], i) => (
        <mesh key={i} geometry={geometry} material={material} position={[x, y, z]} rotation={[0, 0, tilt]} scale={[w, 22, 1]} />
      ))}
    </>
  );
}

function scatter(seed: number, count: number, spread: (rng: () => number) => [number, number, number]) {
  const rng = createRng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) pos.set(spread(rng), i * 3);
  return pos;
}

function World({ dpr, reducedMotion }: { dpr: number; reducedMotion: boolean }) {
  const ground = useMemo(() => buildGround(), []);
  const woods = useMemo(() => buildWoods(), []);
  const geos = useMemo(
    () => ({ trunk: new THREE.CylinderGeometry(0.7, 1, 1, 6), blob: new THREE.IcosahedronGeometry(1, 0), box: new THREE.BoxGeometry(1, 1, 1) }),
    []
  );
  const groundMaterial = useMemo(() => toonMaterial("#ffffff", { flat: true, vertexColors: true }), []);
  const fireflies = useMemo(
    () =>
      scatter(9, 260, (rng) => {
        const nearTree = rng() < 0.4;
        const x = nearTree ? HERO.x + (rng() - 0.5) * 9 : range(rng, -9, 9);
        const z = nearTree ? HERO.z + (rng() - 0.5) * 8 : range(rng, -16, 11);
        return [x, height(x, z) + range(rng, 0.3, nearTree ? 6 : 2.5), z];
      }),
    []
  );
  const motes = useMemo(() => scatter(19, 120, (rng) => [range(rng, -10, 10), range(rng, 1, 12), range(rng, -25, 8)]), []);

  useLayoutEffect(() => () => ground.dispose(), [ground]);

  useFrame(({ camera, clock }) => {
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    camera.position.set(Math.sin(t * 0.08) * 0.35, 1.75 + Math.sin(t * 0.11) * 0.05, 13);
    camera.lookAt(0, 4.2, -10);
  });

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 9, 46]} />
      <SkyDome bands={["#f2e7b6", "#e7e5b6", "#d6e0b0", "#bfd4a8", "#a7c49f"]} />
      <hemisphereLight args={["#fff3cc", "#2a4628", 1.15]} />
      <directionalLight position={[0, 9, 16]} intensity={1.1} color="#ffeccc" />
      <directionalLight position={[2, 20, -25]} intensity={1.4} color="#ffd890" />

      <mesh geometry={ground} material={groundMaterial} />
      <Instanced geometry={geos.trunk} data={woods.trunks} />
      <Instanced geometry={geos.blob} data={woods.crowns} />
      <Instanced geometry={geos.blob} data={woods.bushes} />
      <Instanced geometry={geos.box} data={woods.flowers} />
      <HeroTree reducedMotion={reducedMotion} />
      <LightShafts />

      <Drifters positions={fireflies} color="#ffd25e" size={2 / dpr} blink reducedMotion={reducedMotion} />
      <Drifters positions={motes} color="#fff4d0" size={1 / dpr} blink={false} reducedMotion={reducedMotion} />
    </>
  );
}

function subscribe() {
  return () => {};
}

export function LandingScene() {
  const webgl = useSyncExternalStore(subscribe, hasWebGL, () => false);
  const dpr = usePixelRatio();
  const reducedMotion = usePrefersReducedMotion();
  const recovery = useWebGLRecovery();
  if (!webgl) return null;
  return (
    <div className="pixel-canvas absolute inset-0" aria-hidden="true">
      <Canvas
        key={recovery.canvasKey}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: "low-power" }}
        camera={{ fov: 55, near: 0.1, far: 150 }}
        // The painted sky behind shows through while a lost context is rebuilt.
        style={{ visibility: recovery.lost ? "hidden" : "visible" }}
        onCreated={({ gl }) => recovery.attach(gl.domElement)}
      >
        <World dpr={dpr} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
