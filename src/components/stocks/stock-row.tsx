"use client";

import { changeColor } from "@/lib/utils";
import { fmtNum, fmtVol, fmtBig } from "@/lib/format-utils";
import { StockSparkline } from "@/components/stocks/stock-sparkline";
import { StockDetail } from "@/components/stocks/stock-detail";
import type { StockQuote } from "@/lib/data-ceo-stocks";

function VolumeCell({ volume, avgVolume }: { volume: number; avgVolume: number }) {
  const ratio = avgVolume > 0 ? volume / avgVolume : 0;
  const barPct = Math.min(ratio, 3) / 3 * 100;
  const isHigh = ratio >= 1.5;
  const isLow = ratio > 0 && ratio < 0.5;
  const barColor = isHigh ? "bg-terminal-green/50" : isLow ? "bg-terminal-red/30" : "bg-terminal-muted/30";
  const textColor = isHigh ? "text-terminal-green" : "";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span>
        {fmtVol(volume)}
        {avgVolume > 0 && <span className={`ml-1 text-[10px] ${textColor}`}>{ratio.toFixed(1)}x</span>}
      </span>
      {avgVolume > 0 && (
        <div className="h-[3px] w-12 rounded-full bg-terminal-border/30">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}

function changeBg(change: number): string {
  if (change > 0) return "bg-terminal-green/8";
  if (change < 0) return "bg-terminal-red/8";
  return "";
}

export function StockRow({
  q, expanded, onToggle, onRemove,
}: {
  q: StockQuote;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const color = changeColor(q.change);
  return (
    <>
      <tr
        className="group cursor-pointer border-b border-terminal-border/50 transition-colors hover:bg-terminal-accent/5"
        onClick={onToggle}
      >
        {/* Symbol */}
        <td className="px-4 py-2">
          <a
            href={`https://ceo.ca/${q.ceoSymbol.replace(".V", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-terminal-text underline decoration-terminal-border hover:decoration-terminal-text"
          >
            {q.symbol}
          </a>
          <span className="ml-2 text-terminal-muted">{q.name}</span>
        </td>
        {/* Price */}
        <td className="px-4 py-2 text-right tabular-nums text-terminal-text">
          {fmtNum(q.price)}
        </td>
        {/* Change — color-coded background */}
        <td className={`px-4 py-2 text-right tabular-nums ${color} ${changeBg(q.change)}`}>
          {q.change >= 0 ? "+" : ""}{fmtNum(q.change)} ({q.changePercent >= 0 ? "+" : ""}{fmtNum(q.changePercent)}%)
        </td>
        {/* Volume / Avg */}
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          <VolumeCell volume={q.volume} avgVolume={q.avgVolume} />
        </td>
        {/* VWAP */}
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"}
        </td>
        {/* Shorts */}
        <td className="px-4 py-2 text-right tabular-nums">
          {q.hasCeoData && q.shortVolume > 0 ? (
            <span className="text-terminal-muted">
              {fmtBig(q.shortVolume)}
              {q.shortChange !== 0 && (
                <span className={q.shortChange > 0 ? "ml-1 text-terminal-red" : "ml-1 text-terminal-green"}>
                  {q.shortChange > 0 ? "↑" : "↓"}
                </span>
              )}
            </span>
          ) : "—"}
        </td>
        {/* MCap */}
        <td className="px-4 py-2 text-right tabular-nums text-terminal-muted">
          {q.marketCap > 0 ? fmtBig(q.marketCap) : "—"}
        </td>
        {/* Intraday sparkline */}
        <td className="px-2 py-2">
          <StockSparkline data={q.sparkline} change={q.change} />
        </td>
        {/* Expand / Remove */}
        <td className="w-6 px-2 py-2 text-terminal-muted">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="hidden text-terminal-muted/40 transition-colors hover:text-terminal-red group-hover:inline-block"
            title="Remove from watchlist"
          >
            ×
          </button>
          <span className={`inline-block transition-transform group-hover:hidden ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-terminal-border/30 bg-terminal-surface/80">
          <td colSpan={9}>
            <StockDetail q={q} />
          </td>
        </tr>
      )}
    </>
  );
}
