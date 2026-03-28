"use client";

import { fmtNum, fmtVol, fmtBig } from "@/lib/format-utils";
import { StockSparkline } from "@/components/stocks/stock-sparkline";
import { StockDetail } from "@/components/stocks/stock-detail";
import type { StockQuote } from "@/lib/data-ceo-stocks";

function VolumeCell({ volume, avgVolume }: { volume: number; avgVolume: number }) {
  const ratio = avgVolume > 0 ? volume / avgVolume : 0;
  const barPct = Math.min(ratio, 3) / 3 * 100;
  const isHigh = ratio >= 1.5;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-baseline gap-1">
        <span className="font-sans text-[13px] tabular-nums text-white/80">
          {fmtVol(volume)}
        </span>
        {avgVolume > 0 && (
          <span className={`font-sans text-[10px] tabular-nums ${isHigh ? "text-[#26A69A]" : "text-white/25"}`}>
            {ratio.toFixed(1)}x
          </span>
        )}
      </div>
      {avgVolume > 0 && (
        <div className="h-[2px] w-8 rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full ${isHigh ? "bg-[#26A69A]/50" : "bg-white/15"}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}

function ChangePill({ change, changePercent }: { change: number; changePercent: number }) {
  if (change === 0) {
    return <span className="font-sans text-[13px] tabular-nums text-white/25">0.00%</span>;
  }
  const isUp = change > 0;
  const color = isUp ? "text-[#26A69A]" : "text-[#EF5350]";
  return (
    <span className={`font-sans text-[13px] tabular-nums ${color}`}>
      {isUp ? "+" : ""}{fmtNum(changePercent)}%
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
      <div
        className="group flex cursor-pointer items-center border-b border-white/[0.03] px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
        onClick={onToggle}
      >
        {/* Symbol + name — 22% */}
        <div className="w-[22%]">
          <div className="flex items-baseline gap-2">
            <a
              href={`https://ceo.ca/${q.ceoSymbol.replace(".V", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-sans text-[13px] font-semibold text-white transition-colors hover:text-[#2962FF]"
            >
              {q.symbol}
            </a>
            <span className="truncate font-sans text-[11px] text-white/30">{q.name}</span>
          </div>
        </div>

        {/* Price — 10% */}
        <div className="w-[10%] text-right">
          <span className="font-sans text-[13px] font-medium tabular-nums text-white">
            {fmtNum(q.price)}
          </span>
        </div>

        {/* Change — 14% */}
        <div className="w-[14%] text-right">
          <ChangePill change={q.change} changePercent={q.changePercent} />
        </div>

        {/* Volume — 14% */}
        <div className="w-[14%] text-right">
          <VolumeCell volume={q.volume} avgVolume={q.avgVolume} />
        </div>

        {/* VWAP — 10% */}
        <div className="w-[10%] text-right">
          <span className="font-sans text-[12px] tabular-nums text-white/40">
            {q.hasCeoData && q.vwap > 0 ? fmtNum(q.vwap, 4) : <span className="text-white/15">—</span>}
          </span>
        </div>

        {/* Shorts — 10% */}
        <div className="w-[10%] text-right">
          {q.hasCeoData && q.shortVolume > 0 ? (
            <span className="font-sans text-[12px] tabular-nums text-white/40">
              {fmtBig(q.shortVolume)}
              {q.shortChange !== 0 && (
                <span className={q.shortChange > 0 ? "ml-0.5 text-[#EF5350]" : "ml-0.5 text-[#26A69A]"}>
                  {q.shortChange > 0 ? "↑" : "↓"}
                </span>
              )}
            </span>
          ) : <span className="font-sans text-[12px] text-white/15">—</span>}
        </div>

        {/* MCap — 10% */}
        <div className="w-[10%] text-right">
          <span className="font-sans text-[12px] tabular-nums text-white/40">
            {q.marketCap > 0 ? fmtBig(q.marketCap) : <span className="text-white/15">—</span>}
          </span>
        </div>

        {/* Sparkline — 8% */}
        <div className="w-[8%] flex justify-end">
          <StockSparkline data={q.sparkline} change={q.change} />
        </div>

        {/* Actions — 2% */}
        <div className="w-[2%] text-right">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="hidden text-[12px] text-white/15 transition-colors hover:text-[#EF5350] group-hover:inline-block"
            title="Remove"
          >
            ×
          </button>
          <span className={`inline-block text-[9px] text-white/15 transition-transform group-hover:hidden ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-b border-white/[0.03] bg-white/[0.015]">
          <StockDetail q={q} />
        </div>
      )}
    </>
  );
}
