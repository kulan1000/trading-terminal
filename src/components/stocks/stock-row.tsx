"use client";

import { fmtNum, fmtVol, fmtBig } from "@/lib/format-utils";
import { StockSparkline } from "@/components/stocks/stock-sparkline";
import { StockDetail } from "@/components/stocks/stock-detail";
import type { StockQuote } from "@/lib/data-ceo-stocks";

function VolumeCell({ volume, avgVolume }: { volume: number; avgVolume: number }) {
  const ratio = avgVolume > 0 ? volume / avgVolume : 0;
  const barPct = Math.min(ratio, 3) / 3 * 100;
  const isHigh = ratio >= 1.5;
  const barColor = isHigh ? "bg-tv-bull/50" : "bg-white/20";

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="font-mono tabular-nums text-white/70">
        {fmtVol(volume)}
        {avgVolume > 0 && (
          <span className={`ml-1.5 text-[10px] ${isHigh ? "text-tv-bull" : "text-white/30"}`}>
            {ratio.toFixed(1)}x
          </span>
        )}
      </span>
      {avgVolume > 0 && (
        <div className="h-[2px] w-10 rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}

/** TradingView-style change pill */
function ChangePill({ change, changePercent }: { change: number; changePercent: number }) {
  if (change === 0) {
    return <span className="font-mono text-[12px] text-white/30">0.00%</span>;
  }
  const isUp = change > 0;
  const bg = isUp ? "bg-[#26A69A]/20" : "bg-[#EF5350]/20";
  const text = isUp ? "text-[#26A69A]" : "text-[#EF5350]";
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 font-mono text-[12px] font-medium tabular-nums ${bg} ${text}`}>
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
        className="group cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.025]"
        onClick={onToggle}
      >
        {/* Symbol + company name */}
        <td className="px-6 py-3">
          <div className="flex items-baseline gap-2.5">
            <a
              href={`https://ceo.ca/${q.ceoSymbol.replace(".V", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-sans text-[14px] font-semibold text-white transition-colors hover:text-tv-blue"
            >
              {q.symbol}
            </a>
            <span className="font-sans text-[12px] text-white/35">{q.name}</span>
          </div>
        </td>
        {/* Price */}
        <td className="px-6 py-3 text-right font-mono text-[14px] tabular-nums text-white">
          {fmtNum(q.price)}
        </td>
        {/* Change */}
        <td className="px-6 py-3 text-center">
          <ChangePill change={q.change} changePercent={q.changePercent} />
        </td>
        {/* Volume */}
        <td className="px-6 py-3 text-right text-[12px]">
          <VolumeCell volume={q.volume} avgVolume={q.avgVolume} />
        </td>
        {/* VWAP */}
        <td className="px-6 py-3 text-right font-mono text-[12px] tabular-nums text-white/50">
          {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : "—"}
        </td>
        {/* Shorts */}
        <td className="px-6 py-3 text-right font-mono text-[12px] tabular-nums">
          {q.hasCeoData && q.shortVolume > 0 ? (
            <span className="text-white/50">
              {fmtBig(q.shortVolume)}
              {q.shortChange !== 0 && (
                <span className={q.shortChange > 0 ? "ml-1 text-tv-bear" : "ml-1 text-tv-bull"}>
                  {q.shortChange > 0 ? "↑" : "↓"}
                </span>
              )}
            </span>
          ) : <span className="text-white/20">—</span>}
        </td>
        {/* MCap */}
        <td className="px-6 py-3 text-right font-mono text-[12px] tabular-nums text-white/50">
          {q.marketCap > 0 ? fmtBig(q.marketCap) : <span className="text-white/20">—</span>}
        </td>
        {/* Sparkline */}
        <td className="px-3 py-3">
          <StockSparkline data={q.sparkline} change={q.change} />
        </td>
        {/* Remove / expand */}
        <td className="w-8 px-2 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="hidden font-sans text-[14px] text-white/20 transition-colors hover:text-tv-bear group-hover:inline-block"
            title="Remove"
          >
            ×
          </button>
          <span className={`inline-block text-[10px] text-white/20 transition-transform group-hover:hidden ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.03]">
          <td colSpan={9} className="bg-white/[0.015]">
            <StockDetail q={q} />
          </td>
        </tr>
      )}
    </>
  );
}
