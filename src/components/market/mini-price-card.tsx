"use client";

import type { MarketQuote } from "@/lib/market-data";
import type { AssetSentiment } from "@/lib/sentiment-engine";
import { changeColor } from "@/lib/utils";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";

const PAIRS: Record<string, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

/** Asset accent colors — aligned with design-system */
const ACCENT: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#D0D5DE",
  Oil: "#FF9800",
};

const BIAS_DOT: Record<string, string> = {
  bullish: "#26A69A",
  bearish: "#EF5350",
  neutral: "#FF9800",
};

interface MiniPriceCardProps {
  quote: MarketQuote;
  sentiment?: AssetSentiment;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Compact price card for the tri-view dashboard layout.
 * Shows price, bias dot, mini sparkline, H/L/VOL.
 * Click to make it the active detail panel below.
 */
export function MiniPriceCard({ quote, sentiment, selected, onSelect }: MiniPriceCardProps) {
  const isUp = quote.change >= 0;
  const color = changeColor(quote.change);
  const accent = ACCENT[quote.asset] ?? "#FFFFFF";
  const fractionDigits = quote.asset === "Silver" ? 3 : 2;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        selected
          ? "border-[#2962FF]/45 bg-[#141414] shadow-[0_0_0_1px_rgba(41,98,255,0.35),0_0_30px_-10px_rgba(41,98,255,0.45)]"
          : "border-white/[0.06] bg-[#111111] hover:border-white/[0.12] hover:bg-[#151515]"
      }`}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <div className="px-4 pt-3 pb-3">
        {/* Header: asset + pair + bias dot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[13px] font-semibold text-white">{quote.asset}</span>
            <span className="font-sans text-[10px] uppercase tracking-[0.08em] text-white/40">
              {PAIRS[quote.asset] ?? ""}
            </span>
          </div>
          {sentiment && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: BIAS_DOT[sentiment.bias],
                boxShadow: `0 0 8px ${BIAS_DOT[sentiment.bias]}`,
              }}
            />
          )}
        </div>

        {/* Price + change */}
        <div className="mt-1.5 flex items-baseline gap-2">
          <AnimatedPrice
            value={quote.price}
            className="font-mono text-[26px] font-bold tabular-nums text-white"
          />
          <span className={`font-mono text-[12px] font-semibold tabular-nums ${color}`}>
            {isUp ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Mini sparkline */}
        <div className="mt-2 h-[44px]">
          {quote.sparkline && quote.sparkline.length > 2 && (
            <Sparkline
              data={quote.sparkline}
              timestamps={quote.sparklineTs}
              height={44}
            />
          )}
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] tabular-nums text-white/40">
          <span>H {quote.high.toFixed(fractionDigits)}</span>
          <span>L {quote.low.toFixed(fractionDigits)}</span>
          {quote.volume > 0 && (
            <span className="ml-auto">VOL {(quote.volume / 1000).toFixed(0)}K</span>
          )}
        </div>
      </div>
    </button>
  );
}
