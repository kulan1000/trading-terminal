"use client";

import type { Asset } from "@/lib/types";
import { ASSET_PAIRS } from "@/lib/constants";
import { BiasSparkline } from "./bias-sparkline";

interface BiasAgo {
  score: number;
  direction: string;
}

interface LatestSignal {
  author: string;
  direction: string;
  signal_type: string | null;
  position: string | null;
  created_at: string;
}

export interface BiasData {
  asset: Asset;
  direction: "bullish" | "bearish" | "neutral";
  score: number;
  count: number;
  activeCount: number;
  isHot: boolean;
  flipped: boolean;
  history: { score: number; direction: string; created_at: string }[];
  price: number;
  change: number;
  changePercent: number;
  latestSignal: LatestSignal | null;
  biasAgo: BiasAgo | null;
}

const BIAS: Record<
  string,
  { label: string; chipBg: string; chipText: string; glow: string; border: string }
> = {
  bullish: {
    label: "BULLISH",
    chipBg: "bg-[#26A69A]/15",
    chipText: "text-[#26A69A]",
    glow: "shadow-[0_0_60px_-6px_rgba(38,166,154,0.35),0_0_20px_-4px_rgba(38,166,154,0.15)]",
    border: "border-[#26A69A]/30",
  },
  bearish: {
    label: "BEARISH",
    chipBg: "bg-[#EF5350]/15",
    chipText: "text-[#EF5350]",
    glow: "shadow-[0_0_60px_-6px_rgba(239,83,80,0.35),0_0_20px_-4px_rgba(239,83,80,0.15)]",
    border: "border-[#EF5350]/30",
  },
  neutral: {
    label: "NEUTRAL",
    chipBg: "bg-[#FF9800]/15",
    chipText: "text-[#FF9800]",
    glow: "",
    border: "border-white/[0.06]",
  },
};

const ASSET_ACCENT: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#D0D5DE",
  Oil: "#C9843F",
};

/** Derive plain-English strength label from score (0-100). */
function strengthLabel(score: number): string {
  if (score >= 85) return "Very Strong";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  return "Weak";
}

interface Props {
  bias: BiasData;
  onClick: () => void;
}

/**
 * Sentiment v2 hero card — side-by-side grid item.
 * Shows bias chip + plain-English strength headline + sparkline + 3-stat footer.
 * Click opens the BiasDetailModal.
 */
export function BiasCard({ bias: b, onClick }: Props) {
  const style = BIAS[b.direction] ?? BIAS.neutral;
  const accent = ASSET_ACCENT[b.asset] ?? "#ffffff";

  // 6h bias shift — positive = strengthening in current direction
  const priorScore = b.biasAgo?.score ?? b.score;
  const priorDir = b.biasAgo?.direction ?? b.direction;
  // If direction flipped, always show as a strengthening move (signed by flip)
  const delta =
    priorDir === b.direction
      ? b.score - priorScore
      : b.score + priorScore;
  const deltaPct = priorScore > 0 ? (delta / priorScore) * 100 : 0;
  const deltaUp = delta >= 0;
  const deltaColor = deltaUp ? "text-[#26A69A]" : "text-[#EF5350]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group animate-fade-in relative overflow-hidden rounded-xl border bg-[#111111] text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#141414] ${style.border} ${style.glow}`}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Header: asset name + bias chip */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[13px] font-medium text-white/60">
            {b.asset} · {ASSET_PAIRS[b.asset]}
          </span>
          {b.flipped && (
            <span className="animate-pulse rounded-md bg-[#EF5350]/20 px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#EF5350]">
              Flipped
            </span>
          )}
          {b.isHot && (
            <span className="animate-pulse rounded-md bg-[#FF9800]/20 px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#FF9800]">
              Hot
            </span>
          )}
        </div>
        <span
          className={`rounded-md px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] ${style.chipBg} ${style.chipText}`}
        >
          {style.label}
        </span>
      </div>

      {/* Big headline */}
      <div className="px-5 pt-2.5">
        <div className="font-sans text-[32px] font-bold leading-[1.1] tracking-tight text-white">
          {strengthLabel(b.score)}
        </div>
        <div className="mt-1 font-sans text-[13px] text-white/60">
          {b.direction} bias · {b.score}% confidence
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3.5 h-[70px] px-4">
        {b.history.length >= 2 && <BiasSparkline data={b.history} />}
      </div>

      {/* 3-stat footer */}
      <div className="mt-1 flex items-center justify-between border-t border-white/[0.05] px-5 py-3">
        <div>
          <div className="font-mono text-[18px] font-semibold tabular-nums text-white">
            {b.count}
          </div>
          <div className="mt-0.5 font-sans text-[11px] text-white/50">signals · 24h</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[18px] font-semibold tabular-nums text-white">
            {b.activeCount}
          </div>
          <div className="mt-0.5 font-sans text-[11px] text-white/50">active · 60m</div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-[18px] font-semibold tabular-nums ${deltaColor}`}>
            {deltaUp ? "+" : ""}
            {deltaPct.toFixed(0)}%
          </div>
          <div className="mt-0.5 font-sans text-[11px] text-white/50">vs 6h ago</div>
        </div>
      </div>
    </button>
  );
}
