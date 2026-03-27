"use client";

import { ASSET_PAIRS } from "@/lib/constants";
import { useMarketData } from "@/hooks/use-market-data";
import { PriceCard } from "@/components/market/price-card";
import { MarketOverview } from "@/components/market/market-overview";

export default function MarketPage() {
  const { quotes, loading, lastUpdated } = useMarketData();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Market — Live Prices
        </h1>
        <span className="font-mono text-xs text-terminal-muted">
          {loading
            ? "Loading…"
            : lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()} · CEO.ca`
              : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg border border-terminal-border bg-terminal-surface"
              />
            ))
          : quotes.map((q) => (
              <PriceCard
                key={q.asset}
                quote={q}
                pair={ASSET_PAIRS[q.asset]}
              />
            ))}
      </div>

      {!loading && <MarketOverview quotes={quotes} />}
    </div>
  );
}
