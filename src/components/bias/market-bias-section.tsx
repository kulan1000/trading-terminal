"use client";

import { useState } from "react";
import type { Asset } from "@/lib/types";
import { ASSET_PAIRS } from "@/lib/constants";
import { fmtPrice, fmtAgo } from "@/lib/format-utils";
import { BiasSparkline } from "./bias-sparkline";
import { BiasDetailModal } from "./bias-detail-modal";

interface BiasPoint {
  score: number;
  direction: string;
  created_at: string;
}

interface LatestSignal {
  author: string;
  direction: string;
  signal_type: string | null;
  position: string | null;
  created_at: string;
}

interface BiasAgo {
  score: number;
  direction: string;
}

interface BiasData {
  asset: Asset;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
  activeCount: number;
  isHot: boolean;
  flipped: boolean;
  history: BiasPoint[];
  price: number;
  change: number;
  changePercent: number;
  latestSignal: LatestSignal | null;
  biasAgo: BiasAgo | null;
}

interface Props {
  biases: BiasData[];
}

const DIR_TEXT: Record<string, string> = {
  bullish: "text-[#26A69A]",
  bearish: "text-[#EF5350]",
  neutral: "text-[#FF9800]",
};

const DIR_GLOW: Record<string, string> = {
  bullish: "shadow-[0_0_50px_-8px_rgba(38,166,154,0.3),0_0_20px_-4px_rgba(38,166,154,0.12)]",
  bearish: "shadow-[0_0_50px_-8px_rgba(239,83,80,0.3),0_0_20px_-4px_rgba(239,83,80,0.12)]",
  neutral: "",
};

const DIR_ACCENT: Record<string, string> = {
  bullish: "#26A69A",
  bearish: "#EF5350",
  neutral: "#FF9800",
};


const TYPE_SHORT: Record<string, string> = { entry: "ENTRY", exited: "EXIT", position: "HOLD", opinion: "OPINION", target: "TARGET" };

export function MarketBiasSection({ biases }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const selected = biases.find((b) => b.asset === selectedAsset);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {biases.map((b) => {
          const changePos = b.change >= 0;
          const bullPct = b.score;
          const bearPct = 100 - b.score;
          const accent = DIR_ACCENT[b.direction] ?? "#FF9800";

          return (
            <button
              key={b.asset}
              onClick={() => setSelectedAsset(b.asset)}
              className={`group animate-fade-in cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-left transition-all duration-200 hover:border-white/[0.12] hover:bg-[#151515] hover:scale-[1.005] ${DIR_GLOW[b.direction] ?? ""}`}
            >
              {/* Accent gradient line */}
              <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

              <div className="px-5 pt-4 pb-4">
                {/* Top: Asset name + price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-[13px] font-medium text-white/50">
                      {b.asset} — {ASSET_PAIRS[b.asset]}
                    </h3>
                    {b.flipped && (
                      <span className="animate-pulse rounded-md bg-[#EF5350]/20 px-2 py-0.5 font-sans text-[9px] font-bold uppercase text-[#EF5350] ring-1 ring-[#EF5350]/30">
                        Flipped
                      </span>
                    )}
                    {b.isHot && (
                      <span className="animate-pulse rounded-md bg-[#FF9800]/20 px-2 py-0.5 font-sans text-[9px] font-bold uppercase text-[#FF9800] ring-1 ring-[#FF9800]/30">
                        Hot
                      </span>
                    )}
                  </div>
                  {b.price > 0 && (
                    <div className="text-right">
                      <span className="font-mono text-[13px] font-bold tabular-nums text-white">
                        {fmtPrice(b.asset, b.price)}
                      </span>
                      <span className={`ml-1.5 font-mono text-[11px] font-semibold tabular-nums ${changePos ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                        {changePos ? "+" : ""}{b.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Middle: Direction + score */}
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className={`font-sans text-[22px] font-bold ${DIR_TEXT[b.direction] ?? "text-[#FF9800]"}`}>
                      {b.direction.toUpperCase()}
                    </p>
                    {b.history.length >= 2 && <BiasSparkline data={b.history} />}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[28px] font-bold tabular-nums text-white">{b.score}%</p>
                    <p className="font-sans text-[12px] text-white/30">
                      {b.count} signaler{b.activeCount > 0 && <span className="text-white/50"> · {b.activeCount} aktiva</span>}
                    </p>
                  </div>
                </div>

                {/* Bull/Bear ratio bar */}
                <div className="mt-3">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                    <div className="bg-[#26A69A]/60 transition-all duration-500" style={{ width: `${b.direction === "neutral" ? 50 : bullPct}%` }} />
                    <div className="bg-[#EF5350]/60 transition-all duration-500" style={{ width: `${b.direction === "neutral" ? 50 : bearPct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[10px]">
                    <span className="text-[#26A69A]/70">BULL {b.direction === "neutral" ? "50" : bullPct}%</span>
                    <span className="text-[#EF5350]/70">BEAR {b.direction === "neutral" ? "50" : bearPct}%</span>
                  </div>
                </div>

                {/* Latest signal */}
                {b.latestSignal && (
                  <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
                    <span className={`shrink-0 font-sans text-[10px] font-bold ${b.latestSignal.direction === "bullish" ? "text-[#26A69A]" : b.latestSignal.direction === "bearish" ? "text-[#EF5350]" : "text-[#FF9800]"}`}>
                      {TYPE_SHORT[b.latestSignal.signal_type ?? "opinion"]}
                      {b.latestSignal.position ? ` ${b.latestSignal.position.toUpperCase()}` : ""}
                    </span>
                    <span className="truncate font-sans text-[10px] text-white/40">{b.latestSignal.author}</span>
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-white/20">{fmtAgo(b.latestSignal.created_at)}</span>
                  </div>
                )}

                {/* 6h bias change */}
                {b.biasAgo && (
                  <div className="mt-1.5 font-sans text-[10px] text-white/30">
                    <span className="text-white/20">6h:</span>{" "}
                    <span className={b.biasAgo.direction === "bullish" ? "text-[#26A69A]/60" : b.biasAgo.direction === "bearish" ? "text-[#EF5350]/60" : "text-[#FF9800]/60"}>
                      {b.biasAgo.direction.toUpperCase()} {b.biasAgo.score}%
                    </span>
                    <span className="text-white/20"> → </span>
                    <span className={DIR_TEXT[b.direction] ?? "text-[#FF9800]"}>
                      {b.direction.toUpperCase()} {b.score}%
                    </span>
                  </div>
                )}

                {/* Hover hint */}
                <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.08em] text-white/20 opacity-0 transition-opacity group-hover:opacity-100">
                  Klicka för detaljer →
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && selectedAsset && (
        <BiasDetailModal
          asset={selectedAsset}
          direction={selected.direction}
          score={selected.score}
          count={selected.count}
          price={selected.price}
          changePercent={selected.changePercent}
          biasAgo={selected.biasAgo}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}
