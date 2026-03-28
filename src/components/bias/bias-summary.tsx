"use client";

import { useEffect, useState } from "react";
import { ASSETS, ASSET_TAG_COLORS } from "@/lib/constants";

interface AssetSummary {
  asset: string;
  summary: string;
}

export function BiasSummary() {
  const [summaries, setSummaries] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bias-summary")
      .then((r) => r.json())
      .then((d) => setSummaries(d.summaries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
        <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
          AI Sentiment Summary
        </h3>
        <p className="text-xs italic text-tv-muted animate-pulse">Generating summary...</p>
      </div>
    );
  }

  if (!summaries.length) return null;

  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        AI Sentiment Summary
      </h3>
      <div className="space-y-3">
        {summaries.map((s) => (
          <div key={s.asset} className="flex gap-2 text-xs">
            <span
              className={`mt-0.5 shrink-0 rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[s.asset] ?? "bg-tv-input text-tv-secondary"}`}
            >
              {s.asset}
            </span>
            <p className="leading-relaxed text-tv-text">{s.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
