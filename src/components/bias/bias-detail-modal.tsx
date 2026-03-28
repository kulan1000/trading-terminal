"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ASSET_PAIRS } from "@/lib/constants";
import { fmtPrice, fmtAgoShort } from "@/lib/format-utils";
import type { Asset } from "@/lib/types";
import Link from "next/link";
import { BiasDetailChart } from "./bias-detail-chart";
import { BiasDetailSignals } from "./bias-detail-signals";

interface Stats {
  bullish: number;
  bearish: number;
  entries: number;
  exits: number;
  uniqueTraders: number;
  total: number;
  weightedBullPct: number;
  weightedBearPct: number;
}

interface BiasDetailData {
  asset: string;
  price: number | null;
  intradayPrices?: { ts: number; price: number }[];
  stats: Stats;
  signals: DetailSignal[];
  history: { score: number; direction: string; created_at: string }[];
  summary: string;
  latestSignal: { author: string; direction: string; signal_type: string | null; position: string | null; created_at: string } | null;
  biasChange: { score: number; direction: string } | null;
  traderConsensus: TraderEntry[];
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

interface BiasAgo {
  score: number;
  direction: string;
}

interface TraderEntry {
  author: string;
  direction: string;
  count: number;
  types: string[];
  latestAt: string;
}

interface Props {
  asset: Asset;
  direction: string;
  score: number;
  count: number;
  price: number;
  changePercent: number;
  biasAgo: BiasAgo | null;
  onClose: () => void;
}

const DIR_BADGE: Record<string, string> = {
  bullish: "bg-[#26A69A]/20 text-[#26A69A]",
  bearish: "bg-[#EF5350]/20 text-[#EF5350]",
  neutral: "bg-[#FF9800]/20 text-[#FF9800]",
};

export function BiasDetailModal({ asset, direction, score, count, price, changePercent, biasAgo, onClose }: Props) {
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
        {/* Glossy sheen */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Header with price */}
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
              {data.stats && <StatsBar stats={data.stats} />}
              {/* AI Analys — most valuable, placed right after stats */}
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="px-5 pt-4 pb-4">
                  <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                    AI Analys
                  </h4>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed text-white/70">{data.summary}</p>
                </div>
              </div>
              <BiasDetailChart history={data.history} signals={data.signals} intradayPrices={data.intradayPrices} price={price} asset={asset} />
              {data.traderConsensus?.length > 0 && <TraderConsensus traders={data.traderConsensus} />}
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

function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Bullish", value: `${stats.weightedBullPct}%`, sub: `${stats.bullish} st`, cls: "text-[#26A69A]" },
    { label: "Bearish", value: `${stats.weightedBearPct}%`, sub: `${stats.bearish} st`, cls: "text-[#EF5350]" },
    { label: "Entries", value: String(stats.entries), sub: null, cls: "text-[#2962FF]" },
    { label: "Exits", value: String(stats.exits), sub: null, cls: "text-white/50" },
    { label: "Traders", value: String(stats.uniqueTraders), sub: null, cls: "text-white" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((s) => (
        <div key={s.label} className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="p-3">
            <p className={`font-mono text-[18px] font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">{s.label}</p>
            {s.sub && <p className="mt-0.5 font-mono text-[9px] text-white/20">{s.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

const DIR_DOT: Record<string, string> = {
  bullish: "bg-[#26A69A]", bearish: "bg-[#EF5350]", neutral: "bg-[#FF9800]",
};
const TYPE_TAG: Record<string, string> = {
  entry: "bg-[#26A69A]/15 text-[#26A69A]", exited: "bg-white/[0.04] text-white/40",
  position: "bg-[#2962FF]/15 text-[#2962FF]", opinion: "bg-[#FF9800]/10 text-[#FF9800]",
  target: "bg-[#2962FF]/15 text-[#2962FF]",
};

function traderFreshness(latestAt: string): string {
  const ageH = (Date.now() - new Date(latestAt).getTime()) / 3600000;
  if (ageH <= 1) return "opacity-100";
  if (ageH <= 3) return "opacity-70";
  return "opacity-40";
}


function TraderConsensus({ traders }: { traders: TraderEntry[] }) {
  const bulls = traders.filter((t) => t.direction === "bullish");
  const bears = traders.filter((t) => t.direction === "bearish");

  const renderSide = (list: TraderEntry[], label: string, color: string) => (
    <div className="flex-1">
      <h5 className={`mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] ${color}`}>
        {label} ({list.length})
      </h5>
      <div className="space-y-1.5">
        {list.slice(0, 6).map((t) => (
          <div key={t.author} className={`flex items-center gap-2 ${traderFreshness(t.latestAt)}`}>
            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${DIR_DOT[t.direction]}`} />
            <Link href={`/trader/${encodeURIComponent(t.author)}`} className="truncate font-sans text-[12px] font-medium text-white/70 hover:text-[#2962FF] hover:underline">
              {t.author}
            </Link>
            <div className="ml-auto flex items-center gap-1">
              {t.types.slice(0, 2).map((ty) => (
                <span key={ty} className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[ty] ?? TYPE_TAG.opinion}`}>
                  {ty}
                </span>
              ))}
              <span className="font-mono text-[9px] text-white/20">{fmtAgoShort(t.latestAt)}</span>
              <span className="font-mono text-[10px] text-white/20">{t.count}x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Trader-konsensus
        </h4>
        <div className="flex gap-6">
          {renderSide(bulls, "Bullish", "text-[#26A69A]")}
          <div className="w-px bg-white/[0.06]" />
          {renderSide(bears, "Bearish", "text-[#EF5350]")}
        </div>
      </div>
    </div>
  );
}
