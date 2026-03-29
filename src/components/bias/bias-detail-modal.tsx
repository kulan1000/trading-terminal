"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ASSET_PAIRS } from "@/lib/constants";
import { fmtPrice } from "@/lib/format-utils";
import type { Asset } from "@/lib/types";
import type { BiasDetailData } from "./bias-detail-types";
import { BiasDetailChart } from "./bias-detail-chart";
import { BiasDetailSignals } from "./bias-detail-signals";
import { BiasStatsBar } from "./bias-stats-bar";
import { BiasTraderConsensus } from "./bias-trader-consensus";

interface Props {
  asset: Asset;
  direction: string;
  score: number;
  count: number;
  price: number;
  changePercent: number;
  onClose: () => void;
}

const DIR_BADGE: Record<string, string> = {
  bullish: "bg-[#26A69A]/20 text-[#26A69A]",
  bearish: "bg-[#EF5350]/20 text-[#EF5350]",
  neutral: "bg-[#FF9800]/20 text-[#FF9800]",
};

export function BiasDetailModal({ asset, direction, score, count, price, changePercent, onClose }: Props) {
  const [data, setData] = useState<BiasDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bias-detail?asset=${asset}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [asset]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const changePos = changePercent >= 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-fade-in relative z-10 mx-4 flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-[18px] font-bold text-white">
                {asset} — {ASSET_PAIRS[asset]}
              </h2>
              <span className={`rounded-md px-2.5 py-0.5 font-sans text-[10px] font-bold ${DIR_BADGE[direction] ?? DIR_BADGE.neutral}`}>
                {direction.toUpperCase()} {score}%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              {price > 0 && (
                <span className="font-mono text-[20px] font-bold tabular-nums text-white">
                  {fmtPrice(asset, price)}
                </span>
              )}
              {price > 0 && (
                <span className={`font-mono text-[13px] font-semibold tabular-nums ${changePos ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                  {changePos ? "+" : ""}{changePercent.toFixed(2)}%
                </span>
              )}
              <span className="font-sans text-[12px] text-white/30">{count} signaler</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="animate-pulse font-sans text-[13px] text-white/30">Laddar detaljerad vy...</span>
            </div>
          ) : data ? (
            <>
              {data.stats && <BiasStatsBar stats={data.stats} />}
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="px-5 pt-4 pb-4">
                  <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                    AI Analys
                  </h4>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed text-white/70">{data.summary}</p>
                </div>
              </div>
              <BiasDetailChart
                history={data.history}
                signals={data.signals.filter((s) => !s.signal_type || s.signal_type === "opinion" || s.signal_type === "position")}
                intradayPrices={data.intradayPrices}
                price={price}
                asset={asset}
              />
              {data.traderConsensus?.length > 0 && <BiasTraderConsensus traders={data.traderConsensus} />}
              <BiasDetailSignals signals={data.signals} />
            </>
          ) : (
            <p className="text-center font-sans text-[13px] text-white/30">Kunde inte ladda data.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
