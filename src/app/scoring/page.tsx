"use client";

import { useState } from "react";
import { useScoringData } from "@/hooks/use-scoring-data";
import { ScoreboardTable } from "@/components/scoring/scoreboard-table";
import { OpenPositions } from "@/components/scoring/open-positions";
import { RecentScored } from "@/components/scoring/recent-trades";
import { BackfillButton } from "@/components/scoring/backfill-button";

const ASSETS = ["all", "gold", "silver", "oil"] as const;
type AssetFilter = (typeof ASSETS)[number];

export default function ScoringPage() {
  const { scoreboard, openPositions, recentScored, traderSignals, loading } = useScoringData();
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

  const filteredOpen = asset === "all"
    ? openPositions
    : openPositions.filter((p) => p.asset.toLowerCase() === asset);

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
                    ? "bg-[#2962FF] text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)]"
                    : "bg-white/[0.04] text-white/40 hover:text-white/70"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <BackfillButton />
          <span className="font-sans text-[11px] text-white/30">
            30m · 1h · 2h · 4h efter signal
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse font-sans text-[13px] text-white/40">Loading scoring data...</span>
        </div>
      ) : (
        <>
          <ScoreboardTable traders={filteredScoreboard} traderSignals={filteredSignals} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OpenPositions positions={filteredOpen} />
            <RecentScored signals={filteredRecent} />
          </div>
        </>
      )}
    </div>
  );
}
