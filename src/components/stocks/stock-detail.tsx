"use client";

import type { StockQuote } from "@/app/api/stocks/route";

function fmtNum(n: number, d = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtBig(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  if (n > 0) return `$${n}`;
  return "—";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-terminal-muted">{label}</span>
      <span className="tabular-nums text-terminal-text">{value}</span>
    </div>
  );
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  if (low === 0 && high === 0) return null;
  const range = high - low || 1;
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-terminal-muted">
        <span>{label}</span>
        <span className="tabular-nums">{fmtNum(low)} — {fmtNum(high)}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-terminal-border/50">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-terminal-green/40"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded bg-terminal-text"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StockDetail({ q }: { q: StockQuote }) {
  if (!q.hasCeoData) {
    return (
      <div className="px-4 py-3 text-xs text-terminal-muted">
        Limited data for {q.symbol} — only price from CEO.ca chart (15min delay)
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 px-4 py-3 text-xs">
      {/* Column 1: Price details */}
      <div className="space-y-1.5">
        <Stat label="Prev Close" value={fmtNum(q.prevClose)} />
        <Stat label="Day High" value={fmtNum(q.dayHigh)} />
        <Stat label="Day Low" value={fmtNum(q.dayLow)} />
        <Stat label="VWAP" value={q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"} />
        {q.bidPrice > 0 && (
          <Stat label="Bid" value={`${fmtNum(q.bidPrice)} × ${q.bidVolume.toLocaleString()}`} />
        )}
        {q.askPrice > 0 && (
          <Stat label="Ask" value={`${fmtNum(q.askPrice)} × ${q.askVolume.toLocaleString()}`} />
        )}
      </div>

      {/* Column 2: Fundamentals */}
      <div className="space-y-1.5">
        <Stat label="Market Cap" value={fmtBig(q.marketCap)} />
        <Stat label="Shares" value={q.sharesOutstanding > 0 ? `${(q.sharesOutstanding / 1e6).toFixed(1)}M` : "—"} />
        <Stat label="EPS" value={q.eps !== 0 ? fmtNum(q.eps) : "—"} />
        <Stat label="P/B" value={q.pbRatio > 0 ? fmtNum(q.pbRatio, 1) : "—"} />
        <Stat label="Cash" value={fmtBig(q.cash)} />
        <Stat label="Liabilities" value={fmtBig(q.liabilities)} />
      </div>

      {/* Column 3: Trading */}
      <div className="space-y-1.5">
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
      </div>

      {/* Range bars spanning full width */}
      <div className="col-span-3 space-y-2 border-t border-terminal-border/30 pt-2">
        <RangeBar low={q.dayLow} high={q.dayHigh} current={q.price} label="Day Range" />
        <RangeBar low={q.yearLow} high={q.yearHigh} current={q.price} label="52 Week Range" />
      </div>
    </div>
  );
}
