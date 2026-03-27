"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MarketQuote } from "@/lib/market-data";

const POLL_INTERVAL = 15_000; // 15 seconds (matches server cache TTL)

export function useMarketData() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) return;

      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
        setLastUpdated(new Date());
      }
    } catch {
      // Silently fail — keep showing last data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchQuotes();

    // Poll every 15 seconds
    intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQuotes]);

  return { quotes, loading, lastUpdated };
}
