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
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Market — Live Prices
          </h1>
          {!loading && lastUpdated && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tv-bull opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tv-bull" />
            </span>
          )}
        </div>
        <span className="font-sans text-[12px] text-white/40">
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
                className="h-[310px] animate-skeleton rounded-xl border border-white/[0.06] bg-[#111111]"
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
