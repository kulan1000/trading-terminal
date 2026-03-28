"use client";

import { useEffect, useState } from "react";
import type { TradeMarker } from "@/components/market/sparkline";

export function useTradeMarkers(asset: string) {
  const [markers, setMarkers] = useState<TradeMarker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/trade-markers?asset=${asset}&hours=24`);
        if (!res.ok) return;
        const { markers: m } = await res.json();
        if (!cancelled) setMarkers(m ?? []);
      } catch { /* silent */ }
    }

    load();
    const id = setInterval(load, 60_000); // refresh every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, [asset]);

  return markers;
}
