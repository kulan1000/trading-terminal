"use client";

import { useScoringData } from "@/hooks/use-scoring-data";
import { ScoreboardTable } from "@/components/scoring/scoreboard-table";
import { OpenPositions } from "@/components/scoring/open-positions";
import { RecentTrades } from "@/components/scoring/recent-trades";

export default function ScoringPage() {
  const { scoreboard, openPositions, recentTrades, loading } = useScoringData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Trader Scoring
        </h1>
        <span className="text-xs text-terminal-muted">
          Baserat på entry/exit-signaler från Discord
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-sm text-terminal-muted">Loading scoring data...</span>
        </div>
      ) : (
        <>
          <ScoreboardTable traders={scoreboard} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OpenPositions positions={openPositions} />
            <RecentTrades trades={recentTrades} />
          </div>
        </>
      )}
    </div>
  );
}
