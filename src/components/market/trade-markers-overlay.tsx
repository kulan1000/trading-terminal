// SVG overlay: trade entry/exit triangles + heatmap zones
import { useMemo } from "react";
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
}

export function TradeMarkersOverlay({ markers, timestamps, toX, toY, min, max, width }: Props) {
  const heatZones = useMemo(
    () => (markers.length ? computeHeatZones(markers, min, max) : []),
    [markers, min, max]
  );

  return (
    <>
      {/* Heatmap zones */}
      {heatZones.map((z, i) => {
        const y1 = toY(z.priceMax);
        const y2 = toY(z.priceMin);
        const heatColor = z.buyCount >= z.sellCount ? "0,200,80" : "240,60,60";
        return (
          <rect key={`hz-${i}`} x={0} y={y1} width={width} height={y2 - y1}
            fill={`rgba(${heatColor},${z.intensity * 0.18})`} />
        );
      })}

      {/* Trade markers — triangles */}
      {markers.map((m) => {
        const mTs = new Date(m.created_at).getTime() / 1000;
        if (!timestamps.length || mTs < timestamps[0] || mTs > timestamps[timestamps.length - 1]) return null;
        let mi = 0;
        for (let j = 1; j < timestamps.length; j++) {
          if (Math.abs(timestamps[j] - mTs) < Math.abs(timestamps[mi] - mTs)) mi = j;
        }
        const mx = toX(mi);
        const my = toY(m.price_at_signal);
        const isBuy = (m.signal_type === "entry" && m.position === "long") ||
                      (m.signal_type === "exited" && m.position === "short");
        const mColor = isBuy ? "#22c55e" : "#ef4444";
        const r = 3.5;
        const tri = isBuy
          ? `M${mx},${my - r} L${mx - r},${my + r} L${mx + r},${my + r} Z`
          : `M${mx},${my + r} L${mx - r},${my - r} L${mx + r},${my - r} Z`;
        return <path key={m.id} d={tri} fill={mColor} stroke="#000" strokeWidth="0.5" opacity={0.9} />;
      })}
    </>
  );
}
