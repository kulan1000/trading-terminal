"use client";

import { useState } from "react";
import { useScoringData } from "@/hooks/use-scoring-data";
import { ScoreboardTable } from "@/components/scoring/scoreboard-table";
import { RecentScored } from "@/components/scoring/recent-trades";
import { TradePairs } from "@/components/scoring/trade-pairs";
import { ScoringStatus } from "@/components/scoring/scoring-status";
import { BackfillButton } from "@/components/scoring/backfill-button";
import { ReviewQueue } from "@/components/scoring/review-queue";
import { ReviewStats } from "@/components/scoring/review-stats";
import { AssetAccuracy } from "@/components/scoring/asset-accuracy";
import { BiasAccuracy } from "@/components/scoring/bias-accuracy";
import { useReviews } from "@/hooks/use-reviews";

const ASSETS = ["all", "gold", "silver", "oil"] as const;
type AssetFilter = (typeof ASSETS)[number];

export default function ScoringPage() {
  const {
    scoreboard, recentScored, traderSignals,
    tradePairs, loading, watchlist,
  } = useScoringData();
  const { reviews, handleAction: handleReviewAction } = useReviews();
  const [asset, setAsset] = useState<AssetFilter>("all");

  // Filter by asset
  const filteredSignals = asset === "all"
    ? traderSignals
    : Object.fromEntries(
        Object.entries(traderSignals).map(([k, v]) => [
          k, v.filter((s) => s.asset.toLowerCase() === asset),
        ])
      );

  const filteredScoreboard = asset === "all"
    ? scoreboard
    : scoreboard
        .map((t) => {
          const sigs = filteredSignals[t.author] ?? [];
          const wins = sigs.filter((s) => s.weightedScore > 0).length;
          const total = sigs.reduce((sum, s) => sum + s.weightedScore, 0);
          const consistent = sigs.filter((s) => s.consistent).length;
          return {
            ...t,
            signals: sigs.length,
            wins,
            totalScore: total,
            avgScore: sigs.length > 0 ? total / sigs.length : 0,
            winRate: sigs.length > 0 ? wins / sigs.length : 0,
            consistency: consistent,
          };
        })
        .filter((t) => t.signals >= 1);

  const filteredRecent = asset === "all"
    ? recentScored
    : recentScored.filter((s) => s.asset.toLowerCase() === asset);

  const filteredPairs = asset === "all"
    ? tradePairs
    : tradePairs.filter((p) => p.asset.toLowerCase() === asset);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Trader Scoring
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`rounded-md px-3 py-1.5 font-sans text-[12px] font-medium uppercase tracking-wider transition-all ${
                  asset === a
                    ? "bg-[#FF9800] text-white shadow-[0_0_12px_-3px_rgba(255,152,0,0.4)]"
                    : "bg-white/[0.04] text-white/40 hover:text-white/70"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <BackfillButton />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse font-sans text-[13px] text-white/40">Loading scoring data...</span>
        </div>
      ) : (
        <>
          {/* Status overview */}
          <ScoringStatus
            totalScored={recentScored.length}
            totalTraders={scoreboard.length}
            totalEntries={scoreboard.reduce((s, t) => s + t.entries, 0)}
            totalExits={scoreboard.reduce((s, t) => s + t.exits, 0)}
            totalPairs={tradePairs.length}
          />

          {/* GPT Review Queue */}
          <ReviewQueue reviews={reviews} onAction={handleReviewAction} />

          {/* GPT improvement stats */}
          <ReviewStats />

          {/* Scoreboard — main ranking, click trader for drilldown */}
          <ScoreboardTable traders={filteredScoreboard} traderSignals={filteredSignals} watchlist={watchlist} />

          {/* Recent scored entries/exits with 30m/1h/2h/4h scores */}
          <RecentScored signals={filteredRecent} />

          {/* Trade pairs: entry → exit matching */}
          <TradePairs pairs={filteredPairs} />

          {/* Accuracy insights */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AssetAccuracy traderSignals={filteredSignals} />
            <BiasAccuracy />
          </div>
        </>
      )}
    </div>
  );
}
