"use client";

import { useState } from "react";
import type { MarketQuote } from "@/lib/market-data";
import type { AssetSentiment } from "@/lib/sentiment-engine";
import { changeColor } from "@/lib/utils";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { Sparkline } from "./sparkline";
import { useTradeMarkers } from "@/hooks/use-trade-markers";
import { ChartModal } from "./chart-modal";

const PAIRS: Record<string, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

/** Asset accent + glow colors */
const ASSET_STYLE: Record<string, { accent: string; glow: string }> = {
  Gold: {
    accent: "#FFD700",
    glow: "shadow-[0_0_40px_-12px_rgba(255,193,37,0.45)]",
  },
  Silver: {
    accent: "#D0D5DE",
    glow: "shadow-[0_0_40px_-12px_rgba(192,197,206,0.40)]",
  },
  Oil: {
    accent: "#FF9800",
    glow: "shadow-[0_0_40px_-12px_rgba(255,152,0,0.40)]",
  },
};

const BIAS_BADGE: Record<string, { label: string; cls: string }> = {
  bullish: { label: "BULLISH", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  bearish: { label: "BEARISH", cls: "bg-[#EF5350]/15 text-[#EF5350]" },
  neutral: { label: "NEUTRAL", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
};

const TIMEFRAMES = ["1H", "4H", "1D", "1W", "1M"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

interface DetailPanelProps {
  quote: MarketQuote;
  sentiment?: AssetSentiment;
}

/**
 * Large focused detail panel shown below the tri-view.
 * Big price, bias badge, timeframes, full chart, 6-column stats grid.
 * Clicks on chart open the full-screen ChartModal.
 */
export function DetailPanel({ quote, sentiment }: DetailPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const markers = useTradeMarkers(quote.asset);

  const isUp = quote.change >= 0;
  const color = changeColor(quote.change);
  const arrow = isUp ? "▲" : "▼";
  const style = ASSET_STYLE[quote.asset] ?? { accent: "#FFFFFF", glow: "" };
  const fractionDigits = quote.asset === "Silver" ? 3 : 2;
  const open = quote.price - quote.change;
  const range = quote.high - quote.low;
  const bias = sentiment ? BIAS_BADGE[sentiment.bias] : null;

  return (
    <>
      {expanded && (
        <ChartModal
          quote={quote}
          pair={PAIRS[quote.asset] ?? ""}
          markers={markers}
          onClose={() => setExpanded(false)}
        />
      )}
      <div
        className={`animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] ${style.glow}`}
      >
        {/* Accent bar */}
        <div
          className="h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${style.accent}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.05] px-5 py-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-[18px] font-bold text-white">{quote.asset}</span>
              <span className="font-sans text-[12px] uppercase tracking-[0.08em] text-white/40">
                {PAIRS[quote.asset] ?? ""}
              </span>
              {bias && sentiment && (
                <span
                  className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${bias.cls}`}
                >
                  {bias.label} {sentiment.confidence.toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-baseline gap-3">
              <AnimatedPrice
                value={quote.price}
                className="font-mono text-[44px] font-bold tabular-nums leading-none text-white"
              />
              <span className={`font-mono text-[15px] font-semibold tabular-nums ${color}`}>
                {arrow} <AnimatedPrice value={Math.abs(quote.change)} className="" />
                <span className="ml-1">
                  ({isUp ? "+" : ""}
                  {quote.changePercent.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Timeframe switcher (decorative for now — sparkline always intraday) */}
          <div className="flex gap-0.5 rounded-md border border-white/[0.06] bg-[#0a0a0a] p-0.5">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`rounded px-2.5 py-1 font-sans text-[11px] font-semibold tracking-wide transition-colors ${
                  t === timeframe
                    ? "bg-[#2962FF]/20 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="block w-full cursor-pointer px-4 pt-3 pb-2 transition-opacity hover:opacity-90"
          aria-label={`Expand ${quote.asset} chart`}
        >
          {quote.sparkline && quote.sparkline.length > 2 && (
            <Sparkline
              data={quote.sparkline}
              timestamps={quote.sparklineTs}
              height={180}
              markers={markers}
            />
          )}
        </button>

        {/* 6-column stats grid */}
        <div className="grid grid-cols-6 border-t border-white/[0.05]">
          {[
            ["Open", open.toFixed(fractionDigits)],
            ["High", quote.high.toFixed(fractionDigits)],
            ["Low", quote.low.toFixed(fractionDigits)],
            ["Range", range.toFixed(fractionDigits)],
            ["Volume", quote.volume > 0 ? `${(quote.volume / 1000).toFixed(0)}K` : "—"],
            ["Signals 48h", markers.length.toString()],
          ].map(([label, value], i) => (
            <div
              key={label}
              className={`px-4 py-2.5 ${i === 0 ? "" : "border-l border-white/[0.04]"}`}
            >
              <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
                {label}
              </div>
              <div className="mt-1 font-mono text-[13px] tabular-nums text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
