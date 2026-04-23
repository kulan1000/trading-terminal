"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TraderStatsCards } from "./trader-stats-cards";
import { TraderActivitySummary } from "./trader-activity-summary";
import { TraderAssetBreakdown } from "./trader-asset-breakdown";
import { TraderScoredSignals } from "./trader-scored-signals";
import { TraderRecentSignals } from "./trader-recent-signals";
import { TraderDiscordFeed } from "./trader-discord-feed";

interface Activity {
  lastSignal: string | null;
  lastMessage: string | null;
  totalSignals: number;
  entryCount: number;
  exitCount: number;
  positionCount: number;
  avgConfidence: number;
  assetAccuracy: Record<string, { scored: number; positive: number; avgScore: number }>;
}

interface TraderData {
  author: string;
  credibility: { discord_user: string; total_trades: number; winning_trades: number; total_pnl: number; win_rate: number; score: number } | null;
  profile: { author: string; total_signals: number; primary_asset: string; primary_direction: string; assets_traded: string[]; avg_confidence: number } | null;
  signals: { id: number; asset: string; direction: string; confidence: number; strength: string; signal_type: string; position: string | null; created_at: string }[];
  scores: { signal_id: number; asset: string; signal_type: string; position: string | null; price_at_signal: number; score_30m: number | null; score_1h: number | null; score_2h: number | null; score_4h: number | null; weighted_score: number; consistency_bonus: boolean; scored_at: string }[];
  messages: { id: number; content: string; channel: string; timestamp: string }[];
  assetBreakdown: Record<string, { total: number; bullish: number; bearish: number; entries: number; exits: number }>;
  activity: Activity;
}

export function TraderProfileView({ author }: { author: string }) {
  const [data, setData] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trader/${encodeURIComponent(author)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("[TraderProfileView]", err))
      .finally(() => setLoading(false));
  }, [author]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-pulse font-sans text-[13px] text-white/30">Loading trader profile...</span>
      </div>
    );
  }

  if (!data) {
    return <p className="py-20 text-center font-sans text-[13px] text-white/30">Could not load data.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sentiment" className="font-sans text-[12px] text-white/30 hover:text-white/60 transition-colors">
          ← Community Sentiment
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] font-sans text-[18px] font-bold text-white/60">
          {author.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-sans text-[20px] font-bold text-white">{author}</h1>
          {data.profile && (
            <p className="font-sans text-[12px] text-white/40">
              Primary: {data.profile.primary_asset} · {data.profile.primary_direction} · {data.profile.assets_traded.join(", ")}
            </p>
          )}
        </div>
      </div>

      <TraderStatsCards cred={data.credibility} prof={data.profile} scores={data.scores} />

      {data.activity && <TraderActivitySummary activity={data.activity} />}

      {Object.keys(data.assetBreakdown).length > 0 && (
        <TraderAssetBreakdown breakdown={data.assetBreakdown} />
      )}

      {data.scores.length > 0 && <TraderScoredSignals scores={data.scores} />}

      {data.signals.length > 0 && <TraderRecentSignals signals={data.signals} />}

      {data.messages.length > 0 && <TraderDiscordFeed messages={data.messages} />}
    </div>
  );
}
