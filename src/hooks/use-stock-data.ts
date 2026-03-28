"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StockQuote } from "@/app/api/stocks/route";

const POLL_INTERVAL = 30_000; // 30s

export function useStockData() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) return;
      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
        setLastUpdated(new Date());
      }
    } catch {
      // keep last data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchQuotes]);

  return { quotes, loading, lastUpdated };
}
