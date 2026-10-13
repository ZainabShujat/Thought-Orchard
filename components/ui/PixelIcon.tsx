import React from "react";
import { ICON_COLORS, PIXEL_ICONS, PixelIconName } from "@/components/ui/pixelIcons";

interface PixelIconProps {
  name: PixelIconName;
  /** Size of one icon pixel in CSS px. Whole numbers keep pixels crisp. */
  scale?: number;
  className?: string;
}

/** Renders a code-defined pixel icon as crisp SVG rectangles. Decorative by default. */
export function PixelIcon({ name, scale = 3, className }: PixelIconProps) {
  const rows = PIXEL_ICONS[name];
  const width = rows[0].length;
  const height = rows.length;

  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {rows.flatMap((row, y) =>
        Array.from(row).map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={ICON_COLORS[ch]} />
          )
        )
      )}
    </svg>
  );
}
