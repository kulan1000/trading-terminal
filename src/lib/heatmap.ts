// Compute heatmap zones from trade marker clusters
// Groups markers by price bins, returns intensity zones for SVG overlay

import type { TradeMarker } from "@/components/market/sparkline";

export interface HeatZone {
  priceMin: number;
  priceMax: number;
  count: number;
  intensity: number; // 0-1 normalized
  buyCount: number;
  sellCount: number;
}

/** Cluster markers into price bins and compute heatmap zones */
export function computeHeatZones(
  markers: TradeMarker[],
  priceMin: number,
  priceMax: number,
  bins = 8
): HeatZone[] {
  if (!markers.length) return [];

  const range = priceMax - priceMin || 1;
  const binSize = range / bins;
  const zones: HeatZone[] = [];

  for (let i = 0; i < bins; i++) {
    const lo = priceMin + i * binSize;
    const hi = lo + binSize;
    let buyCount = 0;
    let sellCount = 0;

    for (const m of markers) {
      if (m.price_at_signal >= lo && m.price_at_signal < hi) {
        const isBuy =
          (m.signal_type === "entry" && m.position === "long") ||
          (m.signal_type === "exited" && m.position === "short");
        if (isBuy) buyCount++;
        else sellCount++;
      }
    }

    const count = buyCount + sellCount;
    if (count > 0) {
      zones.push({ priceMin: lo, priceMax: hi, count, intensity: 0, buyCount, sellCount });
    }
  }

  // Normalize intensity
  const maxCount = Math.max(...zones.map((z) => z.count), 1);
  for (const z of zones) {
    z.intensity = z.count / maxCount;
  }

  return zones;
}
