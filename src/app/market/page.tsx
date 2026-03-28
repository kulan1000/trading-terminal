"use client";

import { ASSET_PAIRS } from "@/lib/constants";
import { useMarketData } from "@/hooks/use-market-data";
import { useSentiment } from "@/hooks/use-sentiment";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { PriceCard } from "@/components/market/price-card";
import { MarketStatus } from "@/components/market/market-status";

export default function MarketPage() {
  const { quotes, loading, lastUpdated } = useMarketData();
  const { primary: sentiments } = useSentiment();
  const secondsAgo = useSecondsAgo(lastUpdated);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
            Market — Live Prices
          </h1>
          {!loading && lastUpdated && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tv-bull opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tv-bull" />
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-tv-secondary">
          {loading
            ? "Loading..."
            : lastUpdated
              ? `Updated ${secondsAgo}s ago · ${lastUpdated.toLocaleTimeString()}`
              : ""}
        </span>
      </div>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-skeleton rounded-lg border border-tv-border bg-tv-surface"
              />
            ))
          : quotes.map((q) => {
              const s = sentiments.find((s) => s.asset === q.asset);
              return (
                <PriceCard
                  key={q.asset}
                  quote={q}
                  pair={ASSET_PAIRS[q.asset]}
                  sentiment={s}
                  variant="hero"
                />
              );
            })}
      </div>

      <MarketStatus />
    </div>
  );
}
