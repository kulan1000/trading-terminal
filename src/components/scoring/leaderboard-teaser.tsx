"use client";

import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import { Modal } from "@/components/ui/modal";
import { ScoreboardTable } from "./scoreboard-table";

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  traders: TraderScore[];
  traderSignals: Record<string, ScoredSignal[]>;
  watchlist?: Set<string>;
}

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

function MiniSpark({ signals }: { signals: ScoredSignal[] | undefined }) {
  if (!signals || signals.length < 2) return null;
  const points = signals.slice(0, 8).map((s) => s.weightedScore).reverse();
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 54;
  const h = 18;
  const step = w / (points.length - 1);
  const y = (v: number) => h - 1 - ((v - min) / range) * (h - 2);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(p).toFixed(1)}`)
    .join(" ");
  const lastVal = points[points.length - 1];
  const color = lastVal > 0 ? "#26A69A" : lastVal < 0 ? "#EF5350" : "#787B86";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Full Leaderboard teaser — shows top 3 rows + "+ N more" → modal.
 * Modal uses the existing ScoreboardTable (preserves sort/drilldown).
 */
export function LeaderboardTeaser({
  open,
  onOpen,
  onClose,
  traders,
  traderSignals,
  watchlist,
}: Props) {
  const ranked = [...traders].sort(
    (a, b) => b.winRate - a.winRate || b.totalScore - a.totalScore,
  );
  const top3 = ranked.slice(0, 3);
  const moreCount = Math.max(0, ranked.length - 3);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="group animate-fade-in w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#151515]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-1.5">
          <div>
            <div className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
              Full Leaderboard
            </div>
            <div className="mt-1 font-sans text-[11px] text-white/55">
              {ranked.length} traders · ranked by weighted score
            </div>
          </div>
          <div className="flex items-center gap-1 font-sans text-[11px] font-medium text-[#2962FF]">
            View all
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="px-5 pt-4 pb-5">
          {top3.length === 0 ? (
            <div className="py-6 text-center font-sans text-[12px] text-white/30">
              No ranked traders yet
            </div>
          ) : (
            top3.map((t, i) => {
              const last = i === top3.length - 1;
              return (
                <div
                  key={t.author}
                  className={`flex items-center gap-3.5 py-2.5 ${last ? "" : "border-b border-white/[0.05]"}`}
                >
                  <span className="min-w-[22px] font-mono text-[11px] font-semibold tabular-nums text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate font-sans text-[14px] font-medium text-white">
                    @{t.author}
                  </span>
                  <span
                    className={`min-w-[48px] text-right font-mono text-[13px] font-medium tabular-nums ${winColor(t.winRate)}`}
                  >
                    {Math.round(t.winRate * 100)}%
                  </span>
                  <span
                    className={`min-w-[64px] text-right font-mono text-[13px] font-medium tabular-nums ${scoreColor(t.avgScore)}`}
                  >
                    {t.avgScore > 0 ? "+" : ""}
                    {t.avgScore.toFixed(2)}%
                  </span>
                  <MiniSpark signals={traderSignals[t.author]} />
                </div>
              );
            })
          )}
          {moreCount > 0 && (
            <div className="flex items-center justify-center gap-2 pt-3 font-sans text-[11px] text-white/30">
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>+ {moreCount} more traders</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
            </div>
          )}
        </div>
      </button>

      {open && (
        <Modal
          title="Full Leaderboard"
          subtitle={`${ranked.length} traders · weighted score`}
          footer="Click a trader to drill down · ESC to close"
          onClose={onClose}
          maxWidth={1120}
        >
          <ScoreboardTable
            traders={ranked}
            traderSignals={traderSignals}
            watchlist={watchlist}
          />
        </Modal>
      )}
    </>
  );
}
