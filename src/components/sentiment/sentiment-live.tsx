"use client";

import { useSentiment } from "@/hooks/use-sentiment";
import { BiasGauge } from "@/components/sentiment/bias-gauge";
import { SignalTimeline } from "@/components/sentiment/signal-timeline";
import { SentimentAlerts } from "@/components/sentiment/sentiment-alerts";

export function SentimentLive() {
  const { primary, extended, timeline, history, alerts, updatedAt, loading } = useSentiment();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
          Short-Term Sentiment
        </h2>
        <div className="flex items-center gap-3 text-xs text-tv-secondary">
          <span>60 min window · 20 min hot zone</span>
          {updatedAt && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tv-bull" />
              {new Date(updatedAt).toLocaleTimeString("sv-SE", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                timeZone: "Europe/Stockholm",
              })}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-sm text-tv-secondary">
            Loading sentiment data...
          </span>
        </div>
      ) : (
        <>
          <SentimentAlerts alerts={alerts} />

          <div className="grid grid-cols-3 gap-4">
            {primary.map((s, i) => (
              <BiasGauge key={s.asset} sentiment={s} extended={extended[i]} history={history[s.asset]} />
            ))}
          </div>

          <SignalTimeline signals={timeline} />
        </>
      )}
    </div>
  );
}
