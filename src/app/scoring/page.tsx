"use client";

import { useState } from "react";
import { useScoringData } from "@/hooks/use-scoring-data";
import { ScoreboardTable } from "@/components/scoring/scoreboard-table";
import { OpenPositions } from "@/components/scoring/open-positions";
import { RecentTrades } from "@/components/scoring/recent-trades";

const ASSETS = ["all", "gold", "silver", "oil"] as const;
type AssetFilter = (typeof ASSETS)[number];

export default function ScoringPage() {
  const { scoreboard, openPositions, recentTrades, traderTrades, loading } = useScoringData();
  const [asset, setAsset] = useState<AssetFilter>("all");

  // Filter trades by asset, then recompute scoreboard
  const filteredTrades = asset === "all"
    ? recentTrades
    : recentTrades.filter((t) => t.asset === asset);

  const filteredTraderTrades = asset === "all"
    ? traderTrades
    : Object.fromEntries(
        Object.entries(traderTrades).map(([k, v]) => [k, v.filter((t) => t.asset === asset)])
      );

  // Recompute scoreboard when filtered
  const filteredScoreboard = asset === "all"
    ? scoreboard
    : scoreboard
        .map((s) => {
          const trades = filteredTraderTrades[s.author] ?? [];
          const wins = trades.filter((t) => t.pnl > 0).length;
          const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
          return {
            ...s,
            trades: trades.length,
            wins,
            totalPnl,
            avgPnl: trades.length > 0 ? totalPnl / trades.length : 0,
            winRate: trades.length > 0 ? wins / trades.length : 0,
          };
        })
        .filter((s) => s.trades >= 1);

  const filteredOpen = asset === "all"
    ? openPositions
    : openPositions.filter((p) => p.asset === asset);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
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
                    : "bg-tv-input text-tv-text-secondary hover:text-tv-text"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <span className="text-xs text-tv-text-secondary">
            Entry/exit-signaler från Discord
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-sm text-tv-text-secondary">Loading scoring data...</span>
        </div>
      ) : (
        <>
          <ScoreboardTable traders={filteredScoreboard} traderTrades={filteredTraderTrades} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OpenPositions positions={filteredOpen} />
            <RecentTrades trades={filteredTrades} />
          </div>
        </>
      )}
    </div>
  );
}
