"use client";

import React from "react";
import type { MapModel } from "@/features/world/mapModel";
import { getStageLabel, getStageNumber } from "@/features/growth/stages";
import { WORLD_LAYOUT } from "@/features/world/worldLayout";

/**
 * The parchment map (spec 20.5, reference 06). Everything drawn here comes
 * from `buildMapModel`: the same world layout, regions, paths and stored tree
 * positions as the 3D orchard. World x/z map directly to SVG x/y (north up).
 */

const STAGE_FILL = ["#c9a06a", "#9ccc4a", "#79b347", "#4b8f3e", "#f4a6b8", "#d97fa0", "#2f6b3a"];

export interface MapExcerpt {
  id: string;
  content: string;
}

interface OrchardMapProps {
  model: MapModel;
  excerpts: Record<string, string>;
  /** "open" frames the regions you can walk; "all" shows the whole world. */
  extent: "open" | "all";
  youWereHere: { x: number; z: number; heading: number } | null;
}

function viewBoxFor(model: MapModel, extent: "open" | "all"): [number, number, number, number] {
  const regions = extent === "open" ? model.regions.filter((r) => r.open) : model.regions;
  const minX = Math.min(...regions.map((r) => r.center.x - r.radius)) - 4;
  const maxX = Math.max(...regions.map((r) => r.center.x + r.radius)) + 4;
  const minZ = Math.min(...regions.map((r) => r.center.z - r.radius)) - 4;
  const maxZ = Math.max(...regions.map((r) => r.center.z + r.radius)) + 4;
  return [minX, minZ, maxX - minX, maxZ - minZ];
}

export function OrchardMap({ model, excerpts, extent, youWereHere }: OrchardMapProps) {
  const [vx, vy, vw, vh] = viewBoxFor(model, extent);
  const unit = vw / 60; // stroke and label scale relative to the view
  const entrance = WORLD_LAYOUT.entrance;

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="block h-auto w-full"
      role="img"
      aria-labelledby="map-title map-desc"
      shapeRendering="crispEdges"
    >
      <title id="map-title">Map of your orchard</title>
      <desc id="map-desc">
        {model.trees.length} trees in {model.regions.filter((r) => r.open).length} open region. Paths connect the grove to
        unopened regions in the forest.
      </desc>
      <defs>
        <pattern id="forest" width={3} height={3} patternUnits="userSpaceOnUse">
          <rect width={3} height={3} fill="#3f6e3a" />
          <rect x={0.4} y={0.4} width={1.2} height={1.2} fill="#2f5a30" />
          <rect x={1.9} y={1.7} width={0.9} height={0.9} fill="#4f8a44" />
        </pattern>
      </defs>

      {/* The forest is everywhere that isn't an open region. */}
      <rect x={vx} y={vy} width={vw} height={vh} fill="url(#forest)" />

      {model.regions.map((r) =>
        r.open ? (
          <circle key={r.id} cx={r.center.x} cy={r.center.z} r={r.radius} fill="#a8c66a" stroke="#6b4a2e" strokeWidth={unit * 0.25} />
        ) : (
          <g key={r.id}>
            <circle
              cx={r.center.x}
              cy={r.center.z}
              r={r.radius}
              fill="none"
              stroke="#efd9a8"
              strokeWidth={unit * 0.3}
              strokeDasharray={`${unit} ${unit}`}
            />
            <text x={r.center.x} y={r.center.z} textAnchor="middle" fontSize={unit * 1.6} fill="#f6e7c4" fontFamily="var(--font-ui)">
              {r.name ?? "Unopened"}
            </text>
          </g>
        )
      )}

      {/* Groves where trees are planted. */}
      {model.sites
        .filter((s) => model.regions.find((r) => r.id === s.regionId)?.open)
        .map((s) => (
          <circle key={s.id} cx={s.center.x} cy={s.center.z} r={s.radius} fill="#b7d27a" opacity={0.6} />
        ))}

      {model.paths.map((p) => (
        <polyline
          key={p.id}
          points={p.points.map((pt) => `${pt.x},${pt.z}`).join(" ")}
          fill="none"
          stroke="#c9a06a"
          strokeWidth={p.halfWidth * 2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* Entrance signpost. */}
      <g aria-hidden="true">
        <rect x={entrance.x - 0.8} y={entrance.z - 0.3} width={1.6} height={0.9} fill="#7a4a26" />
        <rect x={entrance.x - 0.15} y={entrance.z + 0.6} width={0.3} height={1.2} fill="#3b2417" />
      </g>

      {model.trees.map((t) => {
        const n = getStageNumber(t.stage);
        const r = 0.5 + n * 0.22;
        const label = `${getStageLabel(t.stage)}: ${excerpts[t.id] ?? ""}`;
        return (
          <a key={t.id} href={`/orchard?tree=${t.id}`} aria-label={`Visit tree. ${label}`} className="map-tree">
            <title>{label}</title>
            {/* Generous invisible target for touch. */}
            <circle cx={t.position.x} cy={t.position.z} r={Math.max(r, 1.8)} fill="transparent" />
            <rect
              x={t.position.x - r}
              y={t.position.z - r}
              width={r * 2}
              height={r * 2}
              fill={STAGE_FILL[n - 1]}
              stroke="#3b2417"
              strokeWidth={unit * 0.15}
            />
          </a>
        );
      })}

      {youWereHere && (
        <g aria-label="Where you last stood" role="img">
          <circle cx={youWereHere.x} cy={youWereHere.z} r={0.9} fill="#f2c14e" stroke="#3b2417" strokeWidth={unit * 0.15} />
          <line
            x1={youWereHere.x}
            y1={youWereHere.z}
            x2={youWereHere.x - Math.sin(youWereHere.heading) * 2}
            y2={youWereHere.z - Math.cos(youWereHere.heading) * 2}
            stroke="#3b2417"
            strokeWidth={unit * 0.2}
          />
        </g>
      )}

      {/* North arrow. */}
      <g aria-hidden="true" transform={`translate(${vx + vw - unit * 3} ${vy + unit * 3})`}>
        <polygon points={`0,${-unit * 1.6} ${unit * 0.8},${unit * 0.8} 0,${unit * 0.3} ${-unit * 0.8},${unit * 0.8}`} fill="#3b2417" />
        <text y={unit * 2.4} textAnchor="middle" fontSize={unit * 1.2} fill="#3b2417" fontFamily="var(--font-ui)">
          N
        </text>
      </g>
    </svg>
  );
}

export const MAP_STAGE_FILL = STAGE_FILL;
