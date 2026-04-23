"use client";

import { MarketBiasSection } from "@/components/bias/market-bias-section";
import { DailyRecap } from "@/components/bias/daily-recap";
import { SignalStreaks } from "@/components/sentiment/signal-streaks";
import { FetchError } from "@/components/ui/fetch-error";
import { usePollingFetch } from "@/hooks/use-polling-fetch";

export default function SentimentPage() {
  const { data: biases, error, retry } = usePollingFetch<unknown[]>({ url: "/api/bias-page-data" });

  return (
    <div className="animate-fade-in space-y-5">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans text-[15px] font-semibold tracking-wide text-white">
              Sentiment — Community Bias
            </h1>
            {biases && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26A69A] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26A69A]" />
              </span>
            )}
          </div>
          <span className="font-sans text-[12px] text-white/40">
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

      <SignalStreaks />
      <DailyRecap />
    </div>
  );
}
