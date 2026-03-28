"use client";

import { useEffect, useState } from "react";
import { ASSET_TAG_COLORS } from "@/lib/constants";

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
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            AI Sentiment Summary
          </h3>
          <p className="mt-3 animate-pulse font-sans text-[12px] italic text-white/30">Generating summary...</p>
        </div>
      </div>
    );
  }

  if (!summaries.length) return null;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          AI Sentiment Summary
        </h3>
      </div>

      <div className="space-y-3 px-5 pb-5">
        {summaries.map((s) => (
          <div key={s.asset} className="flex gap-2.5">
            <span
              className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 font-sans text-[10px] font-bold uppercase ${ASSET_TAG_COLORS[s.asset] ?? "bg-white/[0.04] text-white/50"}`}
            >
              {s.asset}
            </span>
            <p className="font-sans text-[13px] leading-relaxed text-white/70">{s.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
