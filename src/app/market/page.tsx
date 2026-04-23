"use client";

import { useEffect, useState } from "react";
import { useMarketData } from "@/hooks/use-market-data";
import { useSentiment } from "@/hooks/use-sentiment";
import { useSecondsAgo } from "@/hooks/use-seconds-ago";
import { MiniPriceCard } from "@/components/market/mini-price-card";
import { DetailPanel } from "@/components/market/detail-panel";
import { MarketStatus } from "@/components/market/market-status";
import type { Asset } from "@/lib/types";

const ASSETS: Asset[] = ["Gold", "Silver", "Oil"];

export default function MarketPage() {
  const { quotes, loading, lastUpdated } = useMarketData();
  const { primary: sentiments } = useSentiment();
  const secondsAgo = useSecondsAgo(lastUpdated);
  const [selected, setSelected] = useState<Asset>("Gold");

  // Keep ordering stable (Gold / Silver / Oil) regardless of API response order
  const orderedQuotes = ASSETS.map((a) => quotes.find((q) => q.asset === a)).filter(
    (q): q is NonNullable<typeof q> => Boolean(q),
  );
  const selectedQuote = orderedQuotes.find((q) => q.asset === selected) ?? orderedQuotes[0];
  const selectedSentiment = sentiments.find((s) => s.asset === selected);

  // If the selected asset ever disappears (shouldn't happen for fixed 3-asset list,
  // but defensive), fall back to the first available quote.
  useEffect(() => {
    if (orderedQuotes.length > 0 && !orderedQuotes.find((q) => q.asset === selected)) {
      setSelected(orderedQuotes[0].asset);
    }
  }, [orderedQuotes, selected]);

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Market Overview
          </h1>
          {!loading && lastUpdated && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
            </span>
          )}
        </div>
        <span className="font-sans text-[12px] text-white/40">
          {loading
            ? "Loading..."
            : lastUpdated
              ? `3 assets · updated ${secondsAgo}s ago`
              : ""}
        </span>
      </div>

      {/* Tri-view: 3 mini cards in a grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] animate-skeleton rounded-xl border border-white/[0.06] bg-[#111111]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {orderedQuotes.map((q) => {
            const s = sentiments.find((s) => s.asset === q.asset);
            return (
              <MiniPriceCard
                key={q.asset}
                quote={q}
                sentiment={s}
                selected={selected === q.asset}
                onSelect={() => setSelected(q.asset)}
              />
            );
          })}
        </div>
      )}

      {/* "DETAIL" divider */}
      {!loading && selectedQuote && (
        <div className="flex items-center gap-3">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Detail
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      )}

      {/* Detail panel for selected asset */}
      {!loading && selectedQuote && (
        <DetailPanel quote={selectedQuote} sentiment={selectedSentiment} />
      )}

      {loading && (
        <div className="h-[380px] animate-skeleton rounded-xl border border-white/[0.06] bg-[#111111]" />
      )}

      <MarketStatus />
    </div>
  );
}
