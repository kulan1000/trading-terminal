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

export interface PricePoint {
  ts: number; // epoch seconds
  price: number;
}

interface Props {
  history: HistoryPoint[];
  signals?: SignalMarker[];
  intradayPrices?: PricePoint[];
  price?: number;
  asset?: Asset;
}

const W = 820;
const H = 220;
const PAD = { top: 10, right: 55, bottom: 30, left: 40 };

function timeToX(ms: number, start: number, span: number, chartW: number, padLeft: number): number {
  const pct = Math.max(0, Math.min(1, (ms - start) / span));
  return padLeft + pct * chartW;
}

function isoToX(iso: string, start: number, span: number, chartW: number, padLeft: number): number {
  return timeToX(new Date(iso).getTime(), start, span, chartW, padLeft);
}

export function BiasDetailChart({ history, signals, intradayPrices, price, asset }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <span className="font-sans text-[12px] text-white/30">Samlar data för graf...</span>
      </div>
    );
  }

  const now = Date.now();
  const sixH = 6 * 60 * 60 * 1000;
  const start = now - sixH;
  const span = sixH;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // --- Bias line (left Y-axis: %) ---
  const filtered = history.filter((h) => new Date(h.created_at).getTime() >= start);
  const scores = filtered.map((h) => h.score);
  const bMin = Math.min(...scores, 30) - 5;
  const bMax = Math.max(...scores, 70) + 5;
  const bRange = bMax - bMin || 1;

  const biasPoints = filtered.map((h) => {
    const x = isoToX(h.created_at, start, span, chartW, PAD.left);
    const y = PAD.top + chartH - ((h.score - bMin) / bRange) * chartH;
    return { x, y, ...h };
  });

  const biasLine = biasPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const biasArea = biasPoints.length > 0
    ? `${biasLine} L${biasPoints[biasPoints.length - 1].x.toFixed(1)},${PAD.top + chartH} L${biasPoints[0].x.toFixed(1)},${PAD.top + chartH} Z`
    : "";

  const last = biasPoints[biasPoints.length - 1];
  const first = biasPoints[0];
  const trending = last.score > first.score;
  const lineColor = trending ? "#26a69a" : "#ef5350";
  const fillColor = trending ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";

  // --- Price line (right Y-axis: $) ---
  const hasPriceData = (intradayPrices?.length ?? 0) >= 2;
  let priceLine = "";
  let priceYLabels: { val: number; y: number }[] = [];

  if (hasPriceData && asset) {
    const pd = intradayPrices!;
    const prices = pd.map((p) => p.price);
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const pPad = (pMax - pMin) * 0.1 || 1;
    const pMinP = pMin - pPad;
    const pMaxP = pMax + pPad;
    const pRange = pMaxP - pMinP || 1;

    const pricePoints = pd.map((p) => {
      const x = timeToX(p.ts * 1000, start, span, chartW, PAD.left);
      const y = PAD.top + chartH - ((p.price - pMinP) / pRange) * chartH;
      return { x, y };
    });

    priceLine = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    // Right Y-axis labels for price
    priceYLabels = Array.from({ length: 5 }, (_, i) => {
      const val = pMinP + (pRange * i) / 4;
      const y = PAD.top + chartH - (i / 4) * chartH;
      return { val, y };
    });
  }

  // --- Y-axis labels (bias %) ---
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = bMin + (bRange * i) / 4;
    const y = PAD.top + chartH - (i / 4) * chartH;
    return { val: Math.round(val), y };
  });

  // --- X-axis: hourly marks ---
  const xLabels = Array.from({ length: 7 }, (_, i) => {
    const t = start + i * 60 * 60 * 1000;
    const x = PAD.left + (i / 6) * chartW;
    const time = fmtTime(new Date(t).toISOString());
    return { x, time };
  });

  const fiftyY = PAD.top + chartH - ((50 - bMin) / bRange) * chartH;

  // --- Signal markers ---
  const markers = (signals ?? []).filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= start && t <= now;
  });

  // Market closed note
  const showClosedNote = hasPriceData && intradayPrices!.length > 0 &&
    (now / 1000 - intradayPrices![intradayPrices!.length - 1].ts) > 3600;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              Bias-trend 6h
            </h4>
            {showClosedNote && (
              <span className="font-sans text-[9px] text-white/20">· Börsen stängd — senaste prisdata kan vara gammal</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
              <span className="inline-block h-[2px] w-3 rounded" style={{ background: lineColor }} /> Bias
            </span>
            {hasPriceData && (
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
          {/* Grid */}
          {yLabels.map((yl) => (
            <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          <line x1={PAD.left} y1={fiftyY} x2={W - PAD.right} y2={fiftyY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Bias area + line */}
          {biasArea && <path d={biasArea} fill={fillColor} />}
          {biasLine && <path d={biasLine} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

          {/* Price line (real intraday data) */}
          {hasPriceData && priceLine && (
            <path d={priceLine} fill="none" stroke="#2962FF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" />
          )}

          {/* Signal opinion markers */}
          {markers.map((s, i) => {
            const mx = isoToX(s.created_at, start, span, chartW, PAD.left);
            const isBull = s.direction === "bullish";
            const color = isBull ? "#26A69A" : "#EF5350";
            const my = isBull ? PAD.top + 8 : PAD.top + chartH - 8;
            return (
              <g key={`m-${i}`}>
                <line x1={mx} y1={PAD.top} x2={mx} y2={PAD.top + chartH} stroke={color} strokeWidth="0.5" opacity="0.15" />
                <circle cx={mx} cy={my} r="4" fill={color} opacity="0.8" />
                <circle cx={mx} cy={my} r="7" fill={color} opacity="0.15" />
              </g>
            );
          })}

          {/* Current bias dot */}
          {biasPoints.length > 0 && (
            <>
              <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
              <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.2" />
            </>
          )}

          {/* Left Y-axis: bias % */}
          {yLabels.map((yl) => (
            <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end" className="fill-white/20 font-mono text-[10px]">
              {yl.val}%
            </text>
          ))}

          {/* Right Y-axis: price $ */}
          {hasPriceData && priceYLabels.map((pl, i) => (
            <text key={`p-${i}`} x={W - PAD.right + 6} y={pl.y + 3} textAnchor="start" className="fill-[#2962FF]/40 font-mono text-[9px]">
              {asset === "Oil" ? pl.val.toFixed(1) : pl.val.toFixed(0)}
            </text>
          ))}

          {/* X-axis */}
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
