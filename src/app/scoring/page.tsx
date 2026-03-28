"use client";

import { useState } from "react";
import { useScoringData } from "@/hooks/use-scoring-data";
import { ScoreboardTable } from "@/components/scoring/scoreboard-table";
import { OpenPositions } from "@/components/scoring/open-positions";
import { RecentScored } from "@/components/scoring/recent-trades";

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
        <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
          Trader Scoring
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`rounded px-2.5 py-1 font-sans text-[11px] font-medium uppercase tracking-wider transition-colors ${
                  asset === a
                    ? "bg-tv-blue text-white"
                    : "bg-tv-input text-tv-secondary hover:text-tv-text"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <span className="text-xs text-tv-secondary">
            30m · 1h · 2h · 4h efter signal
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-sm text-tv-secondary">Loading scoring data...</span>
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
