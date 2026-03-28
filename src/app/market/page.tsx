"use client";

import { ASSET_PAIRS } from "@/lib/constants";
import { useMarketData } from "@/hooks/use-market-data";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { PriceCard } from "@/components/market/price-card";
import { MarketOverview } from "@/components/market/market-overview";
import { MarketStatus } from "@/components/market/market-status";

export default function MarketPage() {
  const { quotes, loading, lastUpdated } = useMarketData();
  const secondsAgo = useSecondsAgo(lastUpdated);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
          Market — Live Prices
        </h1>
        <span className="font-mono text-xs text-tv-text-secondary">
          {loading
            ? "Loading..."
            : lastUpdated
              ? `Updated ${secondsAgo}s ago · ${lastUpdated.toLocaleTimeString()}`
              : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-skeleton rounded-[6px] border border-tv-border bg-tv-surface"
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

      <MarketStatus />
    </div>
  );
}
