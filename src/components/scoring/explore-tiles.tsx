"use client";

import { useState } from "react";
import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import type { TradePairRow } from "./trade-pairs";
import { Modal } from "@/components/ui/modal";
import { TradePairs } from "./trade-pairs";
import { AssetAccuracy } from "./asset-accuracy";
import { BiasAccuracy } from "./bias-accuracy";
import { ReviewQueue } from "./review-queue";
import { ReviewStats } from "./review-stats";
import { useReviews } from "@/hooks/use-reviews";

type TileKey = "pairs" | "accuracy" | "reviews";

interface Props {
  scoreboard: TraderScore[];
  traderSignals: Record<string, ScoredSignal[]>;
  tradePairs: TradePairRow[];
  reviewCount: number;
}

interface TileDef {
  key: TileKey;
  label: string;
  headline: string;
  sub: string;
  valueCls: string;
  icon: React.ReactNode;
}

function sumPnl(pairs: TradePairRow[]): number {
  return pairs.reduce((s, p) => s + (p.pnl ?? 0), 0);
}

/**
 * Scoring v2 — 3 large "explore" tiles that each open a focused modal:
 * Trade Pairs · Asset Accuracy · GPT Reviews.
 *
 * Keeps the main page breathable by hiding dense tables behind one-click
 * drill-downs (per the design chat: "tier 4 · hidden behind modals").
 */
export function ExploreTiles({
  scoreboard,
  traderSignals,
  tradePairs,
  reviewCount,
}: Props) {
  const [open, setOpen] = useState<TileKey | null>(null);
  const { reviews, handleAction: handleReviewAction } = useReviews();

  const pnl = sumPnl(tradePairs);
  const pendingReviews = reviews.length;

  const tiles: TileDef[] = [
    {
      key: "pairs",
      label: "Trade Pairs",
      headline: tradePairs.length.toString(),
      sub:
        tradePairs.length > 0
          ? `net ${pnl > 0 ? "+" : ""}${pnl.toFixed(1)} across matched entries & exits`
          : "no matched pairs yet",
      valueCls: "text-white",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h11l-3-3M17 13H6l3 3" />
        </svg>
      ),
    },
    {
      key: "accuracy",
      label: "Asset Accuracy",
      headline: scoreboard.length.toString(),
      sub: "win rate breakdown per asset · historical bias accuracy",
      valueCls: "text-white",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 2.5v7.5l5 2.5" />
        </svg>
      ),
    },
    {
      key: "reviews",
      label: "GPT Reviews",
      headline: pendingReviews > 0 ? `${pendingReviews} new` : "0",
      sub:
        pendingReviews > 0
          ? "uncertain classifications awaiting review"
          : "all caught up",
      valueCls: pendingReviews > 0 ? "text-[#FF9800]" : "text-white/50",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2.5l6 2v5c0 3.5-2.5 6.7-6 8-3.5-1.3-6-4.5-6-8v-5l6-2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setOpen(t.key)}
            className="group animate-fade-in rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#151515]"
          >
            <div className="mb-3.5 flex items-center gap-2.5 text-white/55">
              <span>{t.icon}</span>
              <span className="font-sans text-[12px] font-medium uppercase tracking-[0.04em]">
                {t.label}
              </span>
            </div>
            <div
              className={`mb-2 font-mono text-[32px] font-bold leading-none tracking-tight tabular-nums ${t.valueCls}`}
            >
              {t.headline}
            </div>
            <div className="font-sans text-[11px] leading-snug text-white/55">{t.sub}</div>
            <div className="mt-3.5 flex items-center gap-1 font-sans text-[11px] font-medium text-[#2962FF]">
              Open
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {open === "pairs" && (
        <Modal
          title="Trade Pairs"
          subtitle={`${tradePairs.length} matched · net ${pnl > 0 ? "+" : ""}${pnl.toFixed(1)}`}
          footer="Entry → Exit pairs ranked by P&L · ESC to close"
          onClose={() => setOpen(null)}
          maxWidth={1120}
        >
          <TradePairs pairs={tradePairs} />
        </Modal>
      )}

      {open === "accuracy" && (
        <Modal
          title="Accuracy Insights"
          subtitle="Win rate per asset · historical bias accuracy"
          footer="Updated every signal scoring cycle · ESC to close"
          onClose={() => setOpen(null)}
          maxWidth={1120}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AssetAccuracy traderSignals={traderSignals} />
            <BiasAccuracy />
          </div>
        </Modal>
      )}

      {open === "reviews" && (
        <Modal
          title="GPT Reviews"
          subtitle={`${pendingReviews} pending · ${reviewCount} total queued`}
          footer="Approve keeps the GPT classification; Reject surfaces it for correction · ESC to close"
          onClose={() => setOpen(null)}
          maxWidth={1120}
        >
          <div className="space-y-4">
            <ReviewQueue reviews={reviews} onAction={handleReviewAction} />
            <ReviewStats />
          </div>
        </Modal>
      )}
    </>
  );
}
