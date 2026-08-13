"use client";

import { useState } from "react";
import { useScoringData } from "@/hooks/use-scoring-data";
import { useReviews } from "@/hooks/use-reviews";
import { ScoringStats } from "@/components/scoring/scoring-stats";
import { Podium } from "@/components/scoring/podium";
import { LeaderboardTeaser } from "@/components/scoring/leaderboard-teaser";
import { LiveFeedTeaser } from "@/components/scoring/live-feed-teaser";
import { ExploreTiles } from "@/components/scoring/explore-tiles";
import { BackfillButton } from "@/components/scoring/backfill-button";
import { SectionDivider } from "@/components/ui/section-divider";

import { assetClassOf, isKnownAsset } from "@/lib/instruments";

// Class-grouped filters — 27 individual tickers would overflow a chip row;
// traders think in these three buckets (per-ticker drill-down lives in the
// Discord Intel advanced search)
const ASSETS = ["all", "commodities", "indices", "stocks"] as const;
type AssetFilter = (typeof ASSETS)[number];

const CLASS_GROUP: Record<string, Exclude<AssetFilter, "all">> = {
  commodity: "commodities",
  index_future: "indices",
  index: "indices",
  etf: "indices",
  equity: "stocks",
};

const inFilter = (assetName: string, f: AssetFilter) =>
  f === "all" || (isKnownAsset(assetName) && CLASS_GROUP[assetClassOf(assetName)] === f);

type ModalKey = "leaderboard" | "feed" | null;

export default function ScoringPage() {
  const {
    scoreboard,
    recentScored,
    traderSignals,
    tradePairs,
    loading,
  } = useScoringData();
  const { reviews } = useReviews();
  const [asset, setAsset] = useState<AssetFilter>("all");
  const [modal, setModal] = useState<ModalKey>(null);

  // Filter by asset (same logic as before — scoreboard/signals/recent/pairs)
  const filteredSignals =
    asset === "all"
      ? traderSignals
      : Object.fromEntries(
          Object.entries(traderSignals).map(([k, v]) => [
            k,
            v.filter((s) => inFilter(s.asset, asset)),
          ]),
        );

  const filteredScoreboard =
    asset === "all"
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

  const filteredRecent =
    asset === "all"
      ? recentScored
      : recentScored.filter((s) => inFilter(s.asset, asset));

  const filteredPairs =
    asset === "all" ? tradePairs : tradePairs.filter((p) => inFilter(p.asset, asset));

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Trader Scoring
          </h1>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
          </span>
          <span className="font-sans text-[11px] text-white/55">
            Scored over 30m · 1h · 2h · 4h horizons
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {ASSETS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAsset(a)}
                className={`rounded-md px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] transition-all ${
                  asset === a
                    ? "border border-[#2962FF]/25 bg-[#2962FF]/[0.10] text-[#5B8DEF]"
                    : "border border-transparent bg-white/[0.03] text-white/40 hover:text-white/75"
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
        <>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[92px] animate-skeleton rounded-xl border border-white/[0.06] bg-[#111111]"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[180px] animate-skeleton rounded-xl border border-white/[0.06] bg-[#111111]"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Tier 1: 4 stat cards */}
          <ScoringStats
            scoreboard={filteredScoreboard}
            recentScored={filteredRecent}
            tradePairs={filteredPairs}
          />

          {/* Tier 2: podium (top 3 traders) — renders its own divider */}
          <Podium traders={filteredScoreboard} traderSignals={filteredSignals} />

          {/* Tier 3: 2 summary teaser cards — leaderboard + live feed */}
          <SectionDivider label="Leaderboard & Feed" meta="updates every 60s" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <LeaderboardTeaser
              open={modal === "leaderboard"}
              onOpen={() => setModal("leaderboard")}
              onClose={() => setModal(null)}
              traders={filteredScoreboard}
              traderSignals={filteredSignals}
            />
            <LiveFeedTeaser
              open={modal === "feed"}
              onOpen={() => setModal("feed")}
              onClose={() => setModal(null)}
              signals={filteredRecent}
            />
          </div>

          {/* Tier 4: 3 explore tiles — pairs / accuracy / reviews */}
          <SectionDivider label="Explore" meta="trade pairs · accuracy · reviews" />
          <ExploreTiles
            scoreboard={filteredScoreboard}
            traderSignals={filteredSignals}
            tradePairs={filteredPairs}
            reviewCount={reviews.length}
          />
        </>
      )}
    </div>
  );
}
