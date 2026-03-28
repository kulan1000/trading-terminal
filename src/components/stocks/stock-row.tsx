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
  const barColor = isHigh ? "bg-tv-bull/50" : isLow ? "bg-tv-bear/30" : "bg-tv-secondary/30";
  const textColor = isHigh ? "text-tv-bull" : "";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span>
        {fmtVol(volume)}
        {avgVolume > 0 && (
          <span className={`ml-1 text-[10px] ${textColor}`}>{ratio.toFixed(1)}x</span>
        )}
      </span>
      {avgVolume > 0 && (
        <div className="h-[3px] w-12 rounded-full bg-white/[0.04]">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}

/** TradingView-style change badge — colored pill */
function ChangeBadge({ change, changePercent }: { change: number; changePercent: number }) {
  if (change === 0) return <span className="text-tv-secondary">0.00%</span>;
  const isUp = change > 0;
  const bg = isUp ? "bg-tv-bull/15" : "bg-tv-bear/15";
  const text = isUp ? "text-tv-bull" : "text-tv-bear";
  return (
    <span className={`inline-flex items-center rounded-[4px] px-2 py-0.5 ${bg} ${text}`}>
      {isUp ? "+" : ""}{fmtNum(change)} ({isUp ? "+" : ""}{fmtNum(changePercent)}%)
    </span>
  );
}

export function StockRow({
  q, expanded, onToggle, onRemove,
}: {
  q: StockQuote;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <tr
        className="group cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]"
        onClick={onToggle}
      >
        {/* Symbol + name */}
        <td className="px-5 py-2.5">
          <div className="flex items-center gap-2">
            <a
              href={`https://ceo.ca/${q.ceoSymbol.replace(".V", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-tv-heading transition-colors hover:text-tv-blue"
            >
              {q.symbol}
            </a>
            <span className="font-sans text-[12px] text-tv-secondary">{q.name}</span>
          </div>
        </td>
        {/* Price */}
        <td className="px-5 py-2.5 text-right tabular-nums text-tv-heading">
          {fmtNum(q.price)}
        </td>
        {/* Change badge */}
        <td className="px-5 py-2.5 text-right">
          <ChangeBadge change={q.change} changePercent={q.changePercent} />
        </td>
        {/* Volume */}
        <td className="px-5 py-2.5 text-right tabular-nums text-tv-secondary">
          <VolumeCell volume={q.volume} avgVolume={q.avgVolume} />
        </td>
        {/* VWAP */}
        <td className="px-5 py-2.5 text-right tabular-nums text-tv-secondary">
          {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"}
        </td>
        {/* Shorts */}
        <td className="px-5 py-2.5 text-right tabular-nums">
          {q.hasCeoData && q.shortVolume > 0 ? (
            <span className="text-tv-secondary">
              {fmtBig(q.shortVolume)}
              {q.shortChange !== 0 && (
                <span className={q.shortChange > 0 ? "ml-1 text-tv-bear" : "ml-1 text-tv-bull"}>
                  {q.shortChange > 0 ? "↑" : "↓"}
                </span>
              )}
            </span>
          ) : "—"}
        </td>
        {/* Market Cap */}
        <td className="px-5 py-2.5 text-right tabular-nums text-tv-secondary">
          {q.marketCap > 0 ? fmtBig(q.marketCap) : "—"}
        </td>
        {/* Sparkline */}
        <td className="px-3 py-2.5">
          <StockSparkline data={q.sparkline} change={q.change} />
        </td>
        {/* Actions */}
        <td className="w-6 px-2 py-2.5 text-tv-secondary">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="hidden text-tv-muted transition-colors hover:text-tv-bear group-hover:inline-block"
            title="Remove"
          >
            ×
          </button>
          <span className={`inline-block text-[10px] transition-transform group-hover:hidden ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.03] bg-white/[0.015]">
          <td colSpan={9}>
            <StockDetail q={q} />
          </td>
        </tr>
      )}
    </>
  );
}
