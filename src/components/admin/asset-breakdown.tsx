"use client";

import { useState } from "react";

interface AssetStats {
  total: number;
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
  confBuckets?: number[];
}

const ASSET_ORDER = ["Gold", "Silver", "Oil"] as const;
const PAIRS: Record<string, string> = { Gold: "XAUUSD", Silver: "XAGUSD", Oil: "WTI" };
const COLORS: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#D0D5DE",
  Oil: "#FF9800",
};

export function AssetBreakdown({ data }: { data: Record<string, AssetStats> }) {
  const assets = ASSET_ORDER.filter((a) => data[a]);
  const [expanded, setExpanded] = useState<string | null>(assets[0] ?? null);

  if (!assets.length) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-white/30">
        No signals in the last 24h.
      </div>
    );
  }

  return (
    <div>
      {assets.map((asset) => {
        const s = data[asset];
        const open = expanded === asset;
        const bullPct = s.total > 0 ? (s.bullish / s.total) * 100 : 0;
        const histMax = Math.max(...(s.confBuckets ?? [0]), 1);
        return (
          <div key={asset} className="border-b" style={{ borderColor: "var(--color-tv-border)" }}>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left hover:bg-white/[0.02]"
              onClick={() => setExpanded(open ? null : asset)}
            >
              <div className="flex items-center gap-4">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: COLORS[asset],
                    boxShadow: `0 0 6px ${COLORS[asset]}`,
                  }}
                />
                <span className="w-16 text-[13px] font-semibold text-white">{asset}</span>
                <span className="tick text-[10px] text-white/30">{PAIRS[asset]}</span>
                <span className="tick w-12 text-[13px] text-white">{s.total}</span>
                <div className="flex flex-1 items-center gap-2">
                  {s.total > 0 ? (
                    <>
                      <div
                        className="h-1 flex-1 overflow-hidden rounded-full"
                        style={{ background: "rgba(239,83,80,0.15)" }}
                      >
                        <div
                          className="h-full"
                          style={{ width: `${bullPct}%`, background: "var(--color-tv-bull)" }}
                        />
                      </div>
                      <span className="tick w-20 text-right text-[10px] text-white/50">
                        {s.bullish}B · {s.bearish}S
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/30">no signals</span>
                  )}
                </div>
                <span className="tick text-[10px] text-white/30">
                  {s.entries}e / {s.exits}x
                </span>
                <span className="chev text-[11px] text-white/40" data-open={open}>
                  ›
                </span>
              </div>
            </button>
            {open && (
              <div className="animate-expand px-4 pb-4">
                <div className="lbl mb-2">Confidence distribution</div>
                {s.confBuckets && s.confBuckets.some((n) => n > 0) ? (
                  <>
                    <div className="flex h-20 items-end gap-[3px]">
                      {s.confBuckets.map((n, i) => {
                        const strong = i >= 6;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${(n / histMax) * 100}%`,
                              background: strong ? COLORS[asset] : `${COLORS[asset]}66`,
                              minHeight: n > 0 ? 2 : 0,
                            }}
                            title={`${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}: ${n}`}
                          />
                        );
                      })}
                    </div>
                    <div className="tick mt-1 flex justify-between text-[9px] text-white/30">
                      <span>0.0</span>
                      <span>0.5</span>
                      <span>1.0</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-white/30">
                    No confidence data yet. Histogram fills once more signals land.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
