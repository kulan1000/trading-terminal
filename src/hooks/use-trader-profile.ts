"use client";

import { useEffect, useState } from "react";

interface Credibility {
  discord_user: string;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
  score: number;
}

interface Profile {
  author: string;
  total_signals: number;
  primary_asset: string;
  primary_direction: string;
  assets_traded: string[];
  avg_confidence: number;
}

interface Signal {
  id: number;
  asset: string;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string;
  position: string | null;
  created_at: string;
}

interface Score {
  signal_id: number;
  asset: string;
  signal_type: string;
  position: string | null;
  price_at_signal: number;
  score_30m: number | null;
  score_1h: number | null;
  score_2h: number | null;
  score_4h: number | null;
  weighted_score: number;
  consistency_bonus: boolean;
  scored_at: string;
}

interface Message {
  id: number;
  content: string;
  channel: string;
  timestamp: string;
}

interface AssetBreakdown {
  total: number;
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
}

export interface TraderProfileData {
  author: string;
  credibility: Credibility | null;
  profile: Profile | null;
  signals: Signal[];
  scores: Score[];
  messages: Message[];
  assetBreakdown: Record<string, AssetBreakdown>;
  loading: boolean;
}

export function useTraderProfile(author: string): TraderProfileData {
  const [data, setData] = useState<Omit<TraderProfileData, "loading">>({
    author, credibility: null, profile: null,
    signals: [], scores: [], messages: [], assetBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!author) return;
    setLoading(true);
    fetch(`/api/trader/${encodeURIComponent(author)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [author]);

  return { ...data, loading };
}
