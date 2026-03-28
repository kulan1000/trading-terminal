"use client";

import { useEffect, useState, useCallback } from "react";
import type { AssetSentiment } from "@/lib/sentiment-engine";
import type { Direction } from "@/lib/types";

export interface TimelineSignal {
  asset: string;
  direction: Direction;
  signalType: string;
  position: string | null;
  strength: string;
  author: string;
  time: string;
}

interface SentimentData {
  primary: AssetSentiment[];
  extended: AssetSentiment[];
  timeline: TimelineSignal[];
  window: number;
  updatedAt: string;
}

export function useSentiment() {
  const [data, setData] = useState<SentimentData>({
    primary: [], extended: [], timeline: [], window: 60, updatedAt: "",
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetch("/api/sentiment")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetch();
    setLoading(false);
    // Poll every 30s for near-realtime
    const interval = setInterval(refetch, 30_000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { ...data, loading };
}
