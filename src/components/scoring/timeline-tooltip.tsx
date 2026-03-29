"use client";

import type { ScoreHistoryPoint } from "./score-timeline";

interface Props {
  point: ScoreHistoryPoint;
  x: number;
  y: number;
  chartWidth: number;
  chartHeight: number;
  historyLength: number;
  hoverIdx: number;
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-sans text-[10px] text-white/40">{label}</span>
      <span className={`font-mono text-[11px] tabular-nums ${bold ? "font-medium" : ""} ${color}`}>{value}</span>
    </div>
  );
}

function fmtHour(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TimelineTooltip({ point: hp, x: hx, y: hy, chartWidth, chartHeight, historyLength, hoverIdx }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${((hx / chartWidth) * 100).toFixed(1)}%`,
        top: `${((hy / chartHeight) * 100).toFixed(1)}%`,
        transform: hoverIdx > historyLength * 0.7
          ? "translate(calc(-100% - 12px), -50%)"
          : "translate(12px, -50%)",
      }}
    >
      <div className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2.5 shadow-xl">
        <p className="font-sans text-[11px] font-medium text-white">{fmtHour(hp.hour)}</p>
        <div className="mt-1.5 space-y-1">
          <Row label="Signals" value={String(hp.count)} color="text-white" />
          <Row label="Wins" value={String(hp.wins)} color="text-[#26A69A]" />
          <Row label="Losses" value={String(hp.count - hp.wins)} color="text-[#EF5350]" />
          <div className="border-t border-white/[0.06] pt-1">
            <Row
              label="Win Rate"
              value={`${Math.round(hp.winRate * 100)}%`}
              color={hp.winRate >= 0.5 ? "text-[#26A69A]" : "text-[#EF5350]"}
              bold
            />
          </div>
          <Row
            label="Avg Score"
            value={`${hp.avgScore >= 0 ? "+" : ""}${hp.avgScore.toFixed(2)}%`}
            color={hp.avgScore >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}
          />
        </div>
      </div>
    </div>
  );
}
