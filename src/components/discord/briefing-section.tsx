"use client";

import type { DailyBriefing, AssetBreakdown } from "@/lib/queries-briefing";
import { SectionDivider } from "@/components/ui/section-divider";

const ASSET_META: Record<string, { color: string; rgb: string }> = {
  Gold: { color: "#FFD700", rgb: "255,215,0" },
  Silver: { color: "#D0D5DE", rgb: "208,213,222" },
  Oil: { color: "#C9843F", rgb: "201,132,63" },
};

const DIR_STYLE: Record<
  string,
  { label: string; chip: string; arrow: string; text: string }
> = {
  bullish: {
    label: "BULLISH",
    chip:
      "bg-gradient-to-b from-[#26A69A]/25 to-[#26A69A]/10 border-[#26A69A]/25 text-[#26A69A] shadow-[inset_0_1px_0_rgba(38,166,154,0.15),0_0_12px_-2px_rgba(38,166,154,0.35)]",
    arrow: "▲",
    text: "text-[#26A69A]",
  },
  bearish: {
    label: "BEARISH",
    chip:
      "bg-gradient-to-b from-[#EF5350]/25 to-[#EF5350]/10 border-[#EF5350]/25 text-[#EF5350] shadow-[inset_0_1px_0_rgba(239,83,80,0.15),0_0_12px_-2px_rgba(239,83,80,0.35)]",
    arrow: "▼",
    text: "text-[#EF5350]",
  },
  neutral: {
    label: "NEUTRAL",
    chip: "bg-white/[0.04] border-white/[0.08] text-white/55",
    arrow: "—",
    text: "text-[#FF9800]",
  },
};

interface BriefingCardProps {
  breakdown: AssetBreakdown;
  onFilter: (asset: string) => void;
}

function BriefingCard({ breakdown: a, onFilter }: BriefingCardProps) {
  const meta = ASSET_META[a.asset] ?? { color: "#fff", rgb: "255,255,255" };
  const style = DIR_STYLE[a.direction] ?? DIR_STYLE.neutral;
  const total = a.bullCount + a.bearCount || 1;
  const bullPct = (a.bullCount / total) * 100;
  const bearPct = (a.bearCount / total) * 100;
  const signals = a.entries + a.exits + a.opinions + a.targets;
  const trades = a.entries + a.exits;
  const biasRGB = a.direction === "bullish" ? "38,166,154" : "239,83,80";
  const dominantPct = a.direction === "bullish" ? bullPct : bearPct;

  return (
    <button
      type="button"
      onClick={() => onFilter(a.asset)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-4 text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14]"
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 100% 0%, rgba(${biasRGB},0.14), transparent 60%), radial-gradient(ellipse 60% 80% at 0% 100%, rgba(${biasRGB},0.06), transparent 70%)`,
        }}
      />
      {/* Left rail */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2px] opacity-70"
        style={{ background: `linear-gradient(180deg, ${meta.color}, transparent 70%)` }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
          />
          <span className="font-sans text-[13px] font-semibold tracking-[0.015em] text-white">
            {a.asset}
          </span>
          <div className="flex-1" />
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-sans text-[11px] font-bold tracking-[0.04em] ${style.chip}`}
          >
            {style.arrow} {style.label}
          </span>
        </div>

        {/* Big consensus */}
        <div className="mb-3.5 flex items-baseline gap-2">
          <span
            className={`font-mono text-[32px] font-bold tabular-nums leading-none tracking-tight ${style.text}`}
          >
            {dominantPct.toFixed(0)}%
          </span>
          <span className="font-sans text-[11px] font-medium text-white/55">
            {a.direction} consensus
          </span>
        </div>

        {/* Split bar */}
        <div className="mb-3.5 flex h-1 overflow-hidden rounded-sm bg-white/[0.04]">
          {bullPct > 0 && (
            <div
              style={{ flex: bullPct }}
              className="bg-gradient-to-r from-[#26A69A]/50 to-[#26A69A] shadow-[0_0_8px_rgba(38,166,154,0.4)]"
            />
          )}
          {bearPct > 0 && (
            <div
              style={{ flex: bearPct }}
              className="bg-gradient-to-r from-[#EF5350] to-[#EF5350]/50 shadow-[0_0_8px_rgba(239,83,80,0.4)]"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-white/[0.05] pt-3 font-sans text-[11px] text-white/55">
          <span>
            <span className="font-mono font-semibold tabular-nums text-white">
              {signals}
            </span>{" "}
            signals
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-white/25" />
          <span>
            <span className="font-mono font-semibold tabular-nums text-white">
              {trades}
            </span>{" "}
            trades
          </span>
          <div className="flex-1" />
          <span className="font-sans text-[10px] text-white/40 transition-colors group-hover:text-[#2962FF]">
            view →
          </span>
        </div>
      </div>
    </button>
  );
}

interface Props {
  data: DailyBriefing;
  onAssetFilter: (asset: string) => void;
}

/**
 * Discord Intel v2 daily briefing — 3 clickable asset cards.
 * Click filters the feed below to that asset.
 */
export function BriefingSection({ data, onAssetFilter }: Props) {
  if (data.signalCount === 0) return null;

  // Ensure stable Gold/Silver/Oil order regardless of API response order
  const order = ["Gold", "Silver", "Oil"];
  const breakdowns = [...data.assetBreakdown].sort(
    (a, b) => order.indexOf(a.asset) - order.indexOf(b.asset),
  );

  return (
    <section className="animate-fade-in space-y-3">
      <SectionDivider
        label="Daily Briefing"
        meta={`${data.signalCount} signals today · all three commodities`}
      />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {breakdowns.map((b) => (
          <BriefingCard key={b.asset} breakdown={b} onFilter={onAssetFilter} />
        ))}
      </div>
    </section>
  );
}
