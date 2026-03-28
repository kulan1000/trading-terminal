"use client";

import { useEffect, useState } from "react";

export interface TraderScore {
  author: string;
  trades: number;
  wins: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

export interface OpenPosition {
  id: number;
  author: string;
  asset: string;
  position: string | null;
  price_at_signal: number | null;
  created_at: string;
}

export interface RecentTrade {
  author: string;
  asset: string;
  position: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  exitTime: string;
}

interface ScoringData {
  scoreboard: TraderScore[];
  openPositions: OpenPosition[];
  recentTrades: RecentTrade[];
  traderTrades: Record<string, RecentTrade[]>;
}

export function useScoringData() {
  const [data, setData] = useState<ScoringData>({
    scoreboard: [], openPositions: [], recentTrades: [], traderTrades: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scoring")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}
