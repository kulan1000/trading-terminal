export interface BiasDetailStats {
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
  uniqueTraders: number;
  total: number;
  weightedBullPct: number;
  weightedBearPct: number;
}

export interface BiasDetailData {
  asset: string;
  price: number | null;
  intradayPrices?: { ts: number; price: number }[];
  stats: BiasDetailStats;
  signals: DetailSignal[];
  history: { score: number; direction: string; created_at: string }[];
  summary: string;
  latestSignal: { author: string; direction: string; signal_type: string | null; position: string | null; created_at: string } | null;
  biasChange: { score: number; direction: string } | null;
  traderConsensus: TraderEntry[];
}

export interface DetailSignal {
  id: number;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string | null;
  position: string | null;
  interpretation: string | null;
  author: string;
  created_at: string;
  content: string | null;
}

export interface BiasAgo {
  score: number;
  direction: string;
}

export interface TraderEntry {
  author: string;
  direction: string;
  count: number;
  types: string[];
  latestAt: string;
}
