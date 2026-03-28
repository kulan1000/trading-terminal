"use client";

import type { StockQuote } from "@/lib/data-ceo-stocks";
import { fmtNum, fmtBig } from "@/lib/format-utils";

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.02]">
      <span className="font-sans text-[12px] text-white/40">{label}</span>
      <span className={`font-mono text-[12px] tabular-nums ${highlight ? "font-medium text-white" : "text-white/70"}`}>{value}</span>
    </div>
  );
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <h4 className="mb-2 px-3 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
        {title}
      </h4>
      {children}
    </div>
  );
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  if (low === 0 && high === 0) return null;
  const range = high - low || 1;
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <span className="font-sans text-[12px] text-white/40">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-white/30">{fmtNum(low)}</span>
          <div className="relative h-1.5 w-28 rounded-full bg-white/[0.06]">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#EF5350]/30 via-[#FF9800]/20 to-[#26A69A]/30"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.3)]"
              style={{ left: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-white/30">{fmtNum(high)}</span>
        </div>
      </div>
    </div>
  );
}

export function StockDetail({ q }: { q: StockQuote }) {
  if (!q.hasCeoData) {
    return (
      <div className="px-6 py-5 font-sans text-[12px] text-white/30">
        Limited data for <span className="font-semibold text-white/50">{q.symbol}</span> — only price from CEO.ca chart (15min delay)
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-3 gap-6">

        <StatGroup title="Price">
          <Stat label="Prev Close" value={fmtNum(q.prevClose)} />
          <Stat label="Day High" value={fmtNum(q.dayHigh)} highlight />
          <Stat label="Day Low" value={fmtNum(q.dayLow)} highlight />
          <Stat label="VWAP" value={q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"} />
          {q.bidPrice > 0 && (
            <Stat label="Bid" value={`${fmtNum(q.bidPrice)} × ${q.bidVolume.toLocaleString()}`} />
          )}
          {q.askPrice > 0 && (
            <Stat label="Ask" value={`${fmtNum(q.askPrice)} × ${q.askVolume.toLocaleString()}`} />
          )}
        </StatGroup>

        <StatGroup title="Fundamentals">
          <Stat label="Market Cap" value={fmtBig(q.marketCap)} highlight />
          <Stat label="Shares" value={q.sharesOutstanding > 0 ? `${(q.sharesOutstanding / 1e6).toFixed(1)}M` : "—"} />
          <Stat label="EPS" value={q.eps !== 0 ? fmtNum(q.eps) : "—"} />
          <Stat label="P/B" value={q.pbRatio > 0 ? fmtNum(q.pbRatio, 1) : "—"} />
          <Stat label="Cash" value={fmtBig(q.cash)} />
          <Stat label="Liabilities" value={fmtBig(q.liabilities)} />
        </StatGroup>

        <StatGroup title="Activity">
          <Stat label="Avg Vol (30d)" value={q.avgVolume > 0 ? `${(q.avgVolume / 1e3).toFixed(0)}K` : "—"} />
          <Stat label="$ Volume" value={q.dollarVolume > 0 ? fmtBig(q.dollarVolume) : "—"} />
          <Stat label="Beta" value={q.beta > 0 ? fmtNum(q.beta, 2) : "—"} />
          <Stat label="MA 50" value={q.ma50 > 0 ? fmtNum(q.ma50) : "—"} />
          <Stat label="MA 200" value={q.ma200 > 0 ? fmtNum(q.ma200) : "—"} />
          {q.shortVolume > 0 && (
            <Stat
              label="Shorts"
              value={`${(q.shortVolume / 1e3).toFixed(0)}K ${q.shortChange > 0 ? "↑" : q.shortChange < 0 ? "↓" : ""}`}
            />
          )}
        </StatGroup>
      </div>

      {/* Range bars */}
      <div className="mt-5 space-y-3 border-t border-white/[0.04] pt-5">
        <RangeBar low={q.dayLow} high={q.dayHigh} current={q.price} label="Day Range" />
        <RangeBar low={q.yearLow} high={q.yearHigh} current={q.price} label="52W Range" />
      </div>
    </div>
  );
}
