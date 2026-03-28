"use client";

import { useState } from "react";
import type { Asset } from "@/lib/types";
import { DIRECTION_COLOR, DIRECTION_BG, ASSET_PAIRS } from "@/lib/constants";
import { BiasSparkline } from "./bias-sparkline";
import { BiasDetailModal } from "./bias-detail-modal";

interface BiasPoint {
  score: number;
  direction: string;
  created_at: string;
}

interface BiasData {
  asset: Asset;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
  isHot: boolean;
  history: BiasPoint[];
}

interface Props {
  biases: BiasData[];
}

export function MarketBiasSection({ biases }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const selected = biases.find((b) => b.asset === selectedAsset);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {biases.map((b) => (
          <button
            key={b.asset}
            onClick={() => setSelectedAsset(b.asset)}
            className={`group animate-fade-in cursor-pointer rounded-lg border p-5 text-left transition-all duration-200 hover:border-tv-border-hover hover:scale-[1.01] ${DIRECTION_BG[b.direction]} ${
              b.direction === "bullish" ? "shadow-[0_0_30px_-10px_rgba(38,166,154,0.2)]" :
              b.direction === "bearish" ? "shadow-[0_0_30px_-10px_rgba(239,83,80,0.2)]" :
              ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-secondary">
                    {b.asset} — {ASSET_PAIRS[b.asset]}
                  </h3>
                  {b.isHot && (
                    <span className="animate-pulse rounded-full bg-tv-orange/20 px-2 py-0.5 text-[9px] font-bold uppercase text-tv-orange ring-1 ring-tv-orange/30">
                      Hot
                    </span>
                  )}
                </div>
                <p className={`mt-1 font-sans text-2xl font-bold ${DIRECTION_COLOR[b.direction]}`}>
                  {b.direction.toUpperCase()}
                </p>
                {b.history.length >= 2 && <BiasSparkline data={b.history} />}
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-tv-heading">{b.score}%</p>
                <p className="font-mono text-xs text-tv-secondary">{b.count} signals</p>
              </div>
            </div>
            {/* Hover hint */}
            <div className="mt-2 text-[10px] uppercase tracking-wider text-tv-muted opacity-0 transition-opacity group-hover:opacity-100">
              Klicka för detaljer →
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && selectedAsset && (
        <BiasDetailModal
          asset={selectedAsset}
          direction={selected.direction}
          score={selected.score}
          count={selected.count}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}
