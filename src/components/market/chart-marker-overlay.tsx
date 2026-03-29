"use client";

import type { PositionedMarker } from "./marker-utils";
import { MarkerTooltip } from "./marker-tooltip";

interface Props {
  positionedMarkers: PositionedMarker[];
  hoveredMarker: number | null;
  selectedMarker: number | null;
  chartHeight: number;
  onDeselect: () => void;
}

export function ChartMarkerOverlay({
  positionedMarkers, hoveredMarker, selectedMarker, chartHeight, onDeselect,
}: Props) {
  const activeId = selectedMarker ?? hoveredMarker;
  if (activeId === null) return null;

  const p = positionedMarkers.find((m) => m.id === activeId);
  if (!p) return null;

  const flipLeft = p.pctX > 70;
  const isSelected = selectedMarker === activeId;

  return (
    <div
      className={isSelected ? "absolute" : "pointer-events-none absolute"}
      style={{
        left: flipLeft ? "auto" : `${p.pctX}%`,
        right: flipLeft ? `${100 - p.pctX}%` : "auto",
        top: `calc(${(p.py / chartHeight) * 100}% - 10px)`,
        transform: flipLeft ? "translate(50%, -100%)" : "translate(-50%, -100%)",
        zIndex: 40,
      }}
    >
      <MarkerTooltip marker={p} size="large" expanded={isSelected} />
      {isSelected && (
        <button
          onClick={onDeselect}
          style={{
            position: "absolute", top: 4, right: 4,
            width: 16, height: 16, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            color: "#71717a", fontSize: 10, lineHeight: 1,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
