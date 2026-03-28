"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DIRECTION_COLOR, ASSET_PAIRS } from "@/lib/constants";
import type { Asset } from "@/lib/types";
import { BiasDetailChart } from "./bias-detail-chart";
import { BiasDetailSignals } from "./bias-detail-signals";

interface Stats {
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
  uniqueTraders: number;
  total: number;
}

interface BiasDetailData {
  asset: string;
  price: number | null;
  stats: Stats;
  signals: DetailSignal[];
  history: { score: number; direction: string; created_at: string }[];
  summary: string;
}

export interface DetailSignal {
  id: number;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string | null;
  position: string | null;
  interpretation: string | null;
  author: string;
  created_at: string;
  content: string | null;
}

interface Props {
  asset: Asset;
  direction: string;
  score: number;
  count: number;
  price: number;
  changePercent: number;
  onClose: () => void;
}

function formatPrice(asset: string, price: number) {
  if (!price) return "—";
  if (asset === "Oil") return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

  const dirColor = DIRECTION_COLOR[direction as keyof typeof DIRECTION_COLOR] ?? "text-tv-orange";
  const changePos = changePercent >= 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 mx-4 flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl border border-tv-border bg-tv-bg shadow-2xl animate-fade-in">
        {/* Header with price */}
        <div className="flex items-center justify-between border-b border-tv-border px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-lg font-bold text-tv-heading">
                {asset} — {ASSET_PAIRS[asset]}
              </h2>
              <span className={`rounded-[4px] px-2 py-0.5 text-xs font-bold ${
                direction === "bullish" ? "bg-tv-bull/20 text-tv-bull" :
                direction === "bearish" ? "bg-tv-bear/20 text-tv-bear" :
                "bg-tv-orange/20 text-tv-orange"
              }`}>
                {direction.toUpperCase()} {score}%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              {price > 0 && (
                <span className="font-mono text-xl font-bold text-tv-heading">
                  {formatPrice(asset, price)}
                </span>
              )}
              {price > 0 && (
                <span className={`font-mono text-sm font-semibold ${changePos ? "text-tv-bull" : "text-tv-bear"}`}>
                  {changePos ? "+" : ""}{changePercent.toFixed(2)}%
                </span>
              )}
              <span className="text-xs text-tv-secondary">{count} signaler</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-tv-secondary transition-colors hover:bg-tv-elevated hover:text-tv-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="animate-pulse text-sm text-tv-secondary">Laddar detaljerad vy...</span>
            </div>
          ) : data ? (
            <>
              {/* Stats bar */}
              {data.stats && <StatsBar stats={data.stats} />}
              <BiasDetailChart history={data.history} />
              <BiasDetailSignals signals={data.signals} />
              <div className="rounded-lg border border-tv-border bg-tv-surface p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-tv-heading">
                  AI Analys
                </h4>
                <p className="text-sm leading-relaxed text-tv-text">{data.summary}</p>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-tv-secondary">Kunde inte ladda data.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function StatsBar({ stats }: { stats: Stats }) {
  const bullPct = stats.total > 0 ? Math.round((stats.bullish / stats.total) * 100) : 50;

  return (
    <div className="grid grid-cols-5 gap-3">
      {[
        { label: "Bullish", value: stats.bullish, cls: "text-tv-bull" },
        { label: "Bearish", value: stats.bearish, cls: "text-tv-bear" },
        { label: "Entries", value: stats.entries, cls: "text-tv-blue" },
        { label: "Exits", value: stats.exits, cls: "text-tv-secondary" },
        { label: "Traders", value: stats.uniqueTraders, cls: "text-tv-heading" },
      ].map((s) => (
        <div key={s.label} className="rounded-lg border border-tv-border bg-tv-surface p-3 text-center">
          <p className={`font-mono text-lg font-bold ${s.cls}`}>{s.value}</p>
          <p className="text-[10px] uppercase tracking-wider text-tv-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
