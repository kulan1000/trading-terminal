"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StockQuote } from "@/lib/data-ceo-stocks";

const POLL_INTERVAL = 30_000;

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

  const addStock = useCallback(async (
    ceoSymbol: string, displaySymbol: string, name: string, sector: "gold" | "silver" | "oil"
  ) => {
    const res = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ceoSymbol, displaySymbol, name, sector }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await fetchQuotes();
  }, [fetchQuotes]);

  const removeStock = useCallback(async (ceoSymbol: string) => {
    const res = await fetch(`/api/stocks?symbol=${encodeURIComponent(ceoSymbol)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await fetchQuotes();
  }, [fetchQuotes]);

  return { quotes, loading, lastUpdated, addStock, removeStock, refetch: fetchQuotes };
}
