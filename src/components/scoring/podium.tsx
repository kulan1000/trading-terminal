"use client";

import Link from "next/link";
import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import { rankTraders } from "@/lib/rank-traders";
import { SectionDivider } from "@/components/ui/section-divider";

interface PodiumProps {
  traders: TraderScore[];
  traderSignals: Record<string, ScoredSignal[]>;
}

const RANKS: { n: string; label: string; intensity: number }[] = [
  { n: "01", label: "LEADER", intensity: 1.0 },
  { n: "02", label: "RUNNER-UP", intensity: 0.62 },
  { n: "03", label: "THIRD", intensity: 0.38 },
];

function scoreColor(n: number): string {
  if (n > 0) return "text-[#26A69A]";
  if (n < 0) return "text-[#EF5350]";
  return "text-white/50";
}

function winColor(rate: number): string {
  if (rate >= 0.6) return "text-[#26A69A]";
  if (rate >= 0.4) return "text-[#FF9800]";
  return "text-[#EF5350]";
}

function sign(n: number): string {
  return n > 0 ? "+" : "";
}

/** Small in-place SVG sparkline of a trader's recent weighted scores */
function MiniSpark({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 70;
  const h = 34;
  const step = w / (points.length - 1);
  const y = (v: number) => h - 3 - ((v - min) / range) * (h - 6);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(p).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(points.length - 1) * step}
        cy={y(points[points.length - 1])}
        r="2"
        fill={color}
      />
    </svg>
  );
}

/** Derive a list of assets from a trader's recent signals (top 3 distinct) */
function deriveAssets(signals: ScoredSignal[] | undefined): string[] {
  if (!signals || signals.length === 0) return [];
  const counts = new Map<string, number>();
  for (const s of signals) {
    counts.set(s.asset, (counts.get(s.asset) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([a]) => a);
}

/** Derive a last-N trend line of weighted scores for a trader */
function deriveTrend(signals: ScoredSignal[] | undefined, n = 8): number[] {
  if (!signals || signals.length === 0) return [];
  return signals.slice(0, n).map((s) => s.weightedScore).reverse();
}

/**
 * Top-3 trader podium with rank-weighted blue glow.
 * Matches Prototype Scoring v2 "podium" section.
 * Falls back gracefully when fewer than 3 traders are available.
 */
export function Podium({ traders, traderSignals }: PodiumProps) {
  // Reliability-weighted rank (win rate × min(n/10,1)) — same formula as the
  // backend credibility score, so a 3-for-3 fluke can't outrank a 9-of-10
  // trader. 3-signal floor keeps one-offs out entirely.
  const ranked = rankTraders(traders.filter((t) => t.signals >= 3)).slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionDivider
        label="Podium — Top Performers"
        meta={`top ${ranked.length} of ${traders.length} · reliability-weighted`}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {ranked.map((t, i) => {
          const r = RANKS[i];
          const intensity = r.intensity;
          const glow = `0 0 50px -10px rgba(41,98,255,${0.35 * intensity}), 0 0 14px -4px rgba(41,98,255,${0.15 * intensity})`;
          const borderColor = `rgba(41,98,255,${0.22 * intensity})`;
          const railColor = `rgba(41,98,255,${0.55 * intensity})`;
          const nameOpacity = 0.35 + 0.3 * intensity;
          const assets = deriveAssets(traderSignals[t.author]);
          const trend = deriveTrend(traderSignals[t.author]);
          const scoreColorHex =
            t.avgScore > 0 ? "#26A69A" : t.avgScore < 0 ? "#EF5350" : "#787B86";

          return (
            <Link
              key={t.author}
              href={`/trader/${encodeURIComponent(t.author)}`}
              className="group relative block overflow-hidden rounded-xl border bg-[#111111] transition-all duration-200 hover:-translate-y-px hover:border-[#2962FF]/40 hover:bg-[#151515]"
              style={{ boxShadow: glow, borderColor }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: `linear-gradient(180deg, ${railColor}, transparent)` }}
              />

              <div className="px-5 py-4 pl-6">
                <div className="flex items-center gap-2.5">
                  <span
                    className="font-mono text-[11px] font-bold tracking-[0.12em] tabular-nums"
                    style={{ color: `rgba(255,255,255,${nameOpacity})` }}
                  >
                    {r.n}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="font-sans text-[10px] font-semibold tracking-[0.08em] text-white/45">
                    {r.label}
                  </span>
                  <div className="flex-1" />
                  <span className="font-mono text-[11px] tabular-nums text-white/40">
                    {t.signals} signals
                  </span>
                </div>

                <div className="mt-3 font-sans text-[20px] font-bold tracking-tight text-white transition-colors group-hover:text-[#2962FF]">
                  @{t.author}
                </div>
                {assets.length > 0 && (
                  <div className="mt-0.5 font-sans text-[12px] text-white/40">
                    trades {assets.join(" · ")}
                  </div>
                )}

                <div className="mt-3.5 flex items-end gap-3">
                  <div className="flex-1">
                    <div className="font-sans text-[10px] font-medium text-white/45">Win rate</div>
                    <div className={`mt-0.5 font-mono text-[17px] font-semibold tabular-nums ${winColor(t.winRate)}`}>
                      {Math.round(t.winRate * 100)}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-sans text-[10px] font-medium text-white/45">
                      Avg score
                    </div>
                    <div className={`mt-0.5 font-mono text-[17px] font-semibold tabular-nums ${scoreColor(t.avgScore)}`}>
                      {sign(t.avgScore)}
                      {t.avgScore.toFixed(2)}%
                    </div>
                  </div>
                  {trend.length >= 2 && (
                    <div className="self-end pb-0.5">
                      <MiniSpark points={trend} color={scoreColorHex} />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
