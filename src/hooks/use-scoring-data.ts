"use client";

import { useEffect, useState } from "react";
import type { TradePairRow } from "@/components/scoring/trade-pairs";
import type { ScoreHistoryPoint } from "@/components/scoring/score-timeline";

export interface TraderScore {
  author: string;
  signals: number;
  entries: number;
  exits: number;
  wins: number;
  totalScore: number;
  avgScore: number;
  winRate: number;
  consistency: number;
}

export interface OpenPosition {
  id: number;
  author: string;
  asset: string;
  position: string | null;
  price_at_signal: number | null;
  created_at: string;
}

export interface ScoredSignal {
  author: string;
  asset: string;
  signalType: string;
  position: string | null;
  direction: string | null;
  priceAtSignal: number;
  score30m: number | null;
  score1h: number | null;
  score2h: number | null;
  score4h: number | null;
  weightedScore: number;
  consistent: boolean;
  scoredAt: string;
  signalCreatedAt: string;
  messageContent: string | null;
}

interface ScoringData {
  scoreboard: TraderScore[];
  openPositions: OpenPosition[];
  recentScored: ScoredSignal[];
  traderSignals: Record<string, ScoredSignal[]>;
  tradePairs: TradePairRow[];
  scoreHistory: ScoreHistoryPoint[];
}

export function useScoringData() {
  const [data, setData] = useState<ScoringData>({
    scoreboard: [], openPositions: [], recentScored: [],
    traderSignals: {}, tradePairs: [], scoreHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      fetch("/api/scoring")
        .then((r) => r.json())
        .then((d) => { if (mounted) { setData(d); setError(false); } })
        .catch(() => { if (mounted) setError(true); })
        .finally(() => { if (mounted) setLoading(false); });
    };
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return { ...data, loading, error };
}
