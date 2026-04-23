"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";
import { Modal } from "@/components/ui/modal";
import { RecentScored } from "./recent-trades";

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  signals: ScoredSignal[];
}

const TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  exited: { label: "EXIT", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
  position: { label: "HOLD", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function scoreColor(n: number): string {
  if (n > 0) return "text-[#26A69A]";
  if (n < 0) return "text-[#EF5350]";
  return "text-white/50";
}

/**
 * Live Feed teaser — 3 latest scored signals + "+ N more" → modal with
 * full RecentScored list.
 */
export function LiveFeedTeaser({ open, onOpen, onClose, signals }: Props) {
  const latest = signals.slice(0, 3);
  const moreCount = Math.max(0, signals.length - 3);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="group animate-fade-in w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#151515]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="font-sans text-[14px] font-semibold tracking-[0.015em] text-white">
              Live Feed
            </div>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans text-[11px] font-medium text-[#2962FF]">
            View all {signals.length}
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
          {latest.length === 0 ? (
            <div className="py-6 text-center font-sans text-[12px] text-white/30">
              No scored signals yet
            </div>
          ) : (
            latest.map((s, i) => {
              const type = TYPE_STYLE[s.signalType] ?? TYPE_STYLE.position;
              const last = i === latest.length - 1;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 py-2.5 ${last ? "" : "border-b border-white/[0.05]"}`}
                >
                  <span className="min-w-[36px] font-mono text-[10px] tabular-nums text-white/40">
                    {fmtTime(s.scoredAt)}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-sans text-[13px] font-medium text-white">
                      @{s.author}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-bold ${type.cls}`}
                    >
                      {type.label}
                    </span>
                    <span className="font-sans text-[10px] font-medium text-white/55">
                      {s.asset.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[14px] font-semibold tabular-nums ${scoreColor(s.weightedScore)}`}
                  >
                    {s.weightedScore > 0 ? "+" : ""}
                    {s.weightedScore.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
          {moreCount > 0 && (
            <div className="flex items-center justify-center gap-2 pt-3 font-sans text-[11px] text-white/30">
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>+ {moreCount} more signals today</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
            </div>
          )}
        </div>
      </button>

      {open && (
        <Modal
          title="Live Feed"
          subtitle={`${signals.length} scored signals`}
          footer="Click a signal for full horizon breakdown · ESC to close"
          onClose={onClose}
          maxWidth={1120}
        >
          <RecentScored signals={signals} />
        </Modal>
      )}
    </>
  );
}
