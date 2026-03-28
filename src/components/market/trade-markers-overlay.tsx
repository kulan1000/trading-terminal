// SVG overlay: trade entry/exit markers + heatmap zones on sparkline chart
"use client";

import { useMemo, useState } from "react";
import type { TradeMarker } from "./sparkline";
import { computeHeatZones } from "@/lib/heatmap";

interface Props {
  markers: TradeMarker[];
  timestamps: number[];
  toX: (i: number) => number;
  toY: (v: number) => number;
  min: number;
  max: number;
  width: number;
  height: number;
}

// Color + shape config per marker type
function getMarkerStyle(m: TradeMarker) {
  const { signal_type, position } = m;
  if (signal_type === "entry" && position === "long")
    return { color: "#22c55e", shape: "circle" as const, label: "ENTRY LONG" };
  if (signal_type === "entry" && position === "short")
    return { color: "#ef4444", shape: "circle" as const, label: "ENTRY SHORT" };
  if (signal_type === "exited" && position === "long")
    return { color: "#60a5fa", shape: "diamond" as const, label: "EXIT LONG" };
  if (signal_type === "exited" && position === "short")
    return { color: "#f97316", shape: "diamond" as const, label: "EXIT SHORT" };
  // Holding positions
  return { color: "#a78bfa", shape: "square" as const, label: "HOLDING" };
}

export function TradeMarkersOverlay({ markers, timestamps, toX, toY, min, max, width, height }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const heatZones = useMemo(
    () => (markers.length ? computeHeatZones(markers, min, max) : []),
    [markers, min, max]
  );

  // Pre-compute marker positions — clamp to chart edges if outside time range
  const positioned = useMemo(() => {
    if (!timestamps.length) return [];
    return markers.map((m) => {
      const mTs = new Date(m.created_at).getTime() / 1000;
      let mi = 0;
      if (mTs <= timestamps[0]) {
        mi = 0;
      } else if (mTs >= timestamps[timestamps.length - 1]) {
        mi = timestamps.length - 1;
      } else {
        for (let j = 1; j < timestamps.length; j++) {
          if (Math.abs(timestamps[j] - mTs) < Math.abs(timestamps[mi] - mTs)) mi = j;
        }
      }
      return { ...m, mx: toX(mi), my: toY(m.price_at_signal), style: getMarkerStyle(m) };
    }) as Array<TradeMarker & { mx: number; my: number; style: ReturnType<typeof getMarkerStyle> }>;
  }, [markers, timestamps, toX, toY]);

  const r = 4.5;

  return (
    <>
      {/* Heatmap zones */}
      {heatZones.map((z, i) => {
        const y1 = toY(z.priceMax);
        const y2 = toY(z.priceMin);
        const heatColor = z.buyCount >= z.sellCount ? "0,200,80" : "240,60,60";
        return (
          <rect key={`hz-${i}`} x={0} y={y1} width={width} height={Math.max(y2 - y1, 2)}
            fill={`rgba(${heatColor},${z.intensity * 0.15})`} rx={1} />
        );
      })}

      {/* Trade markers */}
      {positioned.map((p) => {
        const isHov = hovered === p.id;
        const sz = isHov ? r * 1.4 : r;
        let shape: React.ReactNode;

        if (p.style.shape === "circle") {
          shape = <circle cx={p.mx} cy={p.my} r={sz} fill={p.style.color}
            stroke={isHov ? "#fff" : "#000"} strokeWidth={isHov ? 1 : 0.5} />;
        } else if (p.style.shape === "diamond") {
          const d = `M${p.mx},${p.my - sz} L${p.mx + sz},${p.my} L${p.mx},${p.my + sz} L${p.mx - sz},${p.my} Z`;
          shape = <path d={d} fill={p.style.color}
            stroke={isHov ? "#fff" : "#000"} strokeWidth={isHov ? 1 : 0.5} />;
        } else {
          shape = <rect x={p.mx - sz * 0.8} y={p.my - sz * 0.8} width={sz * 1.6} height={sz * 1.6}
            fill={p.style.color} stroke={isHov ? "#fff" : "#000"} strokeWidth={isHov ? 1 : 0.5} rx={0.5} />;
        }

        return (
          <g key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Invisible hit area */}
            <circle cx={p.mx} cy={p.my} r={8} fill="transparent" />
            {shape}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hovered !== null && (() => {
        const p = positioned.find((m) => m.id === hovered);
        if (!p) return null;
        const tipW = 90;
        const tx = p.mx + 10 + tipW > width ? p.mx - tipW - 6 : p.mx + 6;
        const ty = Math.max(2, Math.min(p.my - 20, height - 36));
        const time = new Date(p.created_at).toLocaleTimeString("sv-SE", {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
        });
        return (
          <foreignObject x={tx} y={ty} width={tipW} height={36}>
            <div style={{
              background: "rgba(0,0,0,0.85)", borderRadius: 4, padding: "2px 5px",
              fontSize: 8, lineHeight: 1.3, color: "#e4e4e7", whiteSpace: "nowrap",
              border: `1px solid ${p.style.color}40`,
            }}>
              <div style={{ fontWeight: 700, color: p.style.color }}>{p.style.label}</div>
              <div>{p.author} · ${p.price_at_signal.toFixed(1)} · {time}</div>
            </div>
          </foreignObject>
        );
      })()}
    </>
  );
}
