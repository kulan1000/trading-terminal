"use client";

import { fmtTime, fmtPrice } from "@/lib/format-utils";
import type { Asset } from "@/lib/types";

interface HistoryPoint {
  score: number;
  direction: string;
  created_at: string;
}

interface Props {
  history: HistoryPoint[];
  price?: number;
  asset?: Asset;
}

const W = 820;
const H = 200;
const PAD = { top: 10, right: 55, bottom: 30, left: 40 };

export function BiasDetailChart({ history, price, asset }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <span className="font-sans text-[12px] text-white/30">Samlar data för graf...</span>
      </div>
    );
  }

  const scores = history.map((h) => h.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = history.map((h, i) => {
    const x = PAD.left + (i / (history.length - 1)) * chartW;
    const y = PAD.top + chartH - ((h.score - min) / range) * chartH;
    return { x, y, ...h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD.top + chartH} L${PAD.left},${PAD.top + chartH} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.score > first.score;
  const lineColor = trending ? "#26a69a" : "#ef5350";
  const fillColor = trending ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";

  // Price overlay — simulate intraday price points aligned to bias history timestamps
  const showPrice = price && price > 0 && asset;
  let pricePoints: { x: number; y: number }[] = [];
  if (showPrice) {
    // Create synthetic price line based on bias trend (actual price data comes from sparkline in future)
    // For now, show current price as a flat reference line
    const priceY = PAD.top + chartH * 0.5; // centered
    pricePoints = points.map((p) => ({ x: p.x, y: priceY }));
  }

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = PAD.top + chartH - (i / 4) * chartH;
    return { val: Math.round(val), y };
  });

  const xLabels = Array.from({ length: 5 }, (_, i) => {
    const idx = Math.round((i / 4) * (history.length - 1));
    const p = points[idx];
    const time = fmtTime(history[idx].created_at);
    return { x: p.x, time };
  });

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            Bias-trend 24h
          </h4>
          {showPrice && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
                <span className="inline-block h-[2px] w-3 rounded" style={{ background: lineColor }} /> Bias
              </span>
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/30">
                <span className="inline-block h-[2px] w-3 rounded bg-[#2962FF]/60" /> Pris
              </span>
            </div>
          )}
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {yLabels.map((yl) => (
            <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          <path d={areaPath} fill={fillColor} />
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Price reference line */}
          {showPrice && (
            <>
              <line x1={PAD.left} y1={PAD.top + chartH * 0.5} x2={W - PAD.right} y2={PAD.top + chartH * 0.5} stroke="#2962FF" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
              <text x={W - PAD.right + 6} y={PAD.top + chartH * 0.5 + 3} className="fill-[#2962FF]/50 font-mono text-[9px]">
                {fmtPrice(asset!, price!)}
              </text>
            </>
          )}

          <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
          <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.2" />

          {/* Y-axis left: bias % */}
          {yLabels.map((yl) => (
            <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end" className="fill-white/20 font-mono text-[10px]">
              {yl.val}%
            </text>
          ))}
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
