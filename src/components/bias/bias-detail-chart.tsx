"use client";

import { fmtTime, fmtPrice } from "@/lib/format-utils";
import type { Asset } from "@/lib/types";

interface HistoryPoint {
  score: number;
  direction: string;
  created_at: string;
}

export interface SignalMarker {
  direction: string;
  created_at: string;
}

interface Props {
  history: HistoryPoint[];
  signals?: SignalMarker[];
  price?: number;
  asset?: Asset;
}

const W = 820;
const H = 220;
const PAD = { top: 10, right: 55, bottom: 30, left: 40 };

/** Map an ISO timestamp to x-position on the fixed 6h axis */
function timeToX(iso: string, start: number, span: number, chartW: number, padLeft: number): number {
  const t = new Date(iso).getTime();
  const pct = Math.max(0, Math.min(1, (t - start) / span));
  return padLeft + pct * chartW;
}

export function BiasDetailChart({ history, signals, price, asset }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <span className="font-sans text-[12px] text-white/30">Samlar data för graf...</span>
      </div>
    );
  }

  // Fixed 6h window: always from now-6h to now
  const now = Date.now();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const start = now - sixHoursMs;
  const span = sixHoursMs;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Filter history to 6h window and compute score range
  const filtered = history.filter((h) => new Date(h.created_at).getTime() >= start);
  const scores = filtered.map((h) => h.score);
  const min = Math.min(...scores, 30) - 5;
  const max = Math.max(...scores, 70) + 5;
  const range = max - min || 1;

  // Map history points to pixel coordinates on the fixed time axis
  const points = filtered.map((h) => {
    const x = timeToX(h.created_at, start, span, chartW, PAD.left);
    const y = PAD.top + chartH - ((h.score - min) / range) * chartH;
    return { x, y, ...h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD.top + chartH} L${points[0].x.toFixed(1)},${PAD.top + chartH} Z`
    : "";

  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.score > first.score;
  const lineColor = trending ? "#26a69a" : "#ef5350";
  const fillColor = trending ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";

  // Price reference line
  const showPrice = price && price > 0 && asset;

  // Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = PAD.top + chartH - (i / 4) * chartH;
    return { val: Math.round(val), y };
  });

  // X-axis labels — fixed hourly marks across 6h
  const xLabels = Array.from({ length: 7 }, (_, i) => {
    const t = start + i * 60 * 60 * 1000;
    const x = PAD.left + (i / 6) * chartW;
    const time = fmtTime(new Date(t).toISOString());
    return { x, time };
  });

  // 50% reference line y-position
  const fiftyY = PAD.top + chartH - ((50 - min) / range) * chartH;

  // Signal markers — positioned on the chart at their timestamp
  const markerSignals = (signals ?? []).filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= start && t <= now;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            Bias-trend 6h
          </h4>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
              <span className="inline-block h-[2px] w-3 rounded" style={{ background: lineColor }} /> Bias
            </span>
            {showPrice && (
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
                <span className="inline-block h-[2px] w-3 rounded bg-[#2962FF]/60" /> Pris
              </span>
            )}
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
              <span className="inline-block h-2 w-2 rounded-full bg-[#26A69A]" /> Bull
            </span>
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
              <span className="inline-block h-2 w-2 rounded-full bg-[#EF5350]" /> Bear
            </span>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {/* Grid lines */}
          {yLabels.map((yl) => (
            <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}

          {/* 50% reference line */}
          <line x1={PAD.left} y1={fiftyY} x2={W - PAD.right} y2={fiftyY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Area + line */}
          {areaPath && <path d={areaPath} fill={fillColor} />}
          {linePath && <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

          {/* Price reference line */}
          {showPrice && (
            <>
              <line x1={PAD.left} y1={PAD.top + chartH * 0.5} x2={W - PAD.right} y2={PAD.top + chartH * 0.5} stroke="#2962FF" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
              <text x={W - PAD.right + 6} y={PAD.top + chartH * 0.5 + 3} className="fill-[#2962FF]/50 font-mono text-[9px]">
                {fmtPrice(asset!, price!)}
              </text>
            </>
          )}

          {/* Signal opinion markers */}
          {markerSignals.map((s, i) => {
            const mx = timeToX(s.created_at, start, span, chartW, PAD.left);
            const isBull = s.direction === "bullish";
            const color = isBull ? "#26A69A" : "#EF5350";
            // Place markers at top (bullish) or bottom (bearish) of chart area
            const my = isBull ? PAD.top + 8 : PAD.top + chartH - 8;
            return (
              <g key={`m-${i}`}>
                {/* Vertical tick line */}
                <line x1={mx} y1={PAD.top} x2={mx} y2={PAD.top + chartH} stroke={color} strokeWidth="0.5" opacity="0.15" />
                {/* Marker dot */}
                <circle cx={mx} cy={my} r="4" fill={color} opacity="0.8" />
                <circle cx={mx} cy={my} r="7" fill={color} opacity="0.15" />
              </g>
            );
          })}

          {/* Current position dot */}
          {points.length > 0 && (
            <>
              <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
              <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.2" />
            </>
          )}

          {/* Y-axis labels */}
          {yLabels.map((yl) => (
            <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end" className="fill-white/20 font-mono text-[10px]">
              {yl.val}%
            </text>
          ))}

          {/* X-axis labels — hourly marks */}
          {xLabels.map((xl, i) => (
            <text key={i} x={xl.x} y={H - 4} textAnchor="middle" className="fill-white/20 font-mono text-[10px]">
              {xl.time}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
