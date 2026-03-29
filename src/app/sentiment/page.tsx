"use client";

import { MarketBiasSection } from "@/components/bias/market-bias-section";
import { FetchError } from "@/components/ui/fetch-error";
import { usePollingFetch } from "@/hooks/use-polling-fetch";

export default function SentimentPage() {
  const { data: biases, error, retry } = usePollingFetch<unknown[]>({ url: "/api/bias-page-data" });

  return (
    <div className="animate-fade-in space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
            Community Sentiment
          </h1>
          <span className="font-sans text-xs text-tv-secondary">
            Gold &middot; Silver &middot; Oil
          </span>
        </div>

        {biases ? (
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          <MarketBiasSection biases={biases as any} />
        ) : error ? (
          <FetchError onRetry={retry} />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[200px] animate-pulse rounded-xl border border-white/[0.06] bg-[#111111]" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
