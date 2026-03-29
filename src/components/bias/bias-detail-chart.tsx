"use client";

import { fmtTime } from "@/lib/format-utils";
import type { Asset } from "@/lib/types";
import type { DetailSignal } from "./bias-detail-types";
import { CHART_W as W, CHART_H as H, CHART_PAD as PAD, timeToX, isoToX, yAxisLabels, pointsToPath } from "./chart-utils";
import { BiasChartMarkers, type BiasMarker } from "./bias-chart-markers";

interface HistoryPoint { score: number; direction: string; created_at: string }
export interface PricePoint { ts: number; price: number }

interface Props {
  history: HistoryPoint[];
  signals?: DetailSignal[];
  intradayPrices?: PricePoint[];
  price?: number;
  asset?: Asset;
}

/** Interpolate bias score at a given timestamp from sorted history points */
function interpolateScore(ts: number, data: { t: number; score: number }[]): number {
  if (data.length === 0) return 50;
  if (ts <= data[0].t) return data[0].score;
  if (ts >= data[data.length - 1].t) return data[data.length - 1].score;
  for (let i = 1; i < data.length; i++) {
    if (ts <= data[i].t) {
      const pct = (ts - data[i - 1].t) / (data[i].t - data[i - 1].t);
      return data[i - 1].score + pct * (data[i].score - data[i - 1].score);
    }
  }
  return data[data.length - 1].score;
}

export function BiasDetailChart({ history, signals, intradayPrices, asset }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <span className="font-sans text-[12px] text-white/30">Samlar data för graf...</span>
      </div>
    );
  }

  const now = Date.now();
  const sixH = 6 * 3600000;
  const start = now - sixH;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const filtered = history.filter((h) => new Date(h.created_at).getTime() >= start);
  const biasData = filtered.length >= 2 ? filtered : history;
  const scores = biasData.map((h) => h.score);
  const bMin = Math.min(...scores, 30) - 5;
  const bMax = Math.max(...scores, 70) + 5;
  const bRange = bMax - bMin || 1;

  const dataStart = Math.min(...biasData.map((h) => new Date(h.created_at).getTime()));
  const dataEnd = Math.max(...biasData.map((h) => new Date(h.created_at).getTime()), now);
  const useNowWindow = filtered.length >= 2;
  const xStart = useNowWindow ? start : dataStart - 600000;
  const xSpan = useNowWindow ? sixH : Math.max(dataEnd - xStart, sixH);

  const biasPoints = biasData.map((h) => ({
    x: timeToX(new Date(h.created_at).getTime(), xStart, xSpan, chartW, PAD.left),
    y: PAD.top + chartH - ((h.score - bMin) / bRange) * chartH,
    ...h,
  }));

  const biasLine = pointsToPath(biasPoints);
  const biasArea = biasPoints.length > 0
    ? `${biasLine} L${biasPoints[biasPoints.length - 1].x.toFixed(1)},${PAD.top + chartH} L${biasPoints[0].x.toFixed(1)},${PAD.top + chartH} Z`
    : "";

  const last = biasPoints[biasPoints.length - 1];
  const first = biasPoints[0];
  const trending = last.score > first.score;
  const lineColor = trending ? "#26a69a" : "#ef5350";
  const fillColor = trending ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";

  // Price line
  const xEnd = xStart + xSpan;
  const hasPriceData = (intradayPrices?.length ?? 0) >= 2 &&
    intradayPrices!.some((p) => p.ts * 1000 >= xStart && p.ts * 1000 <= xEnd);
  let priceLine = "";
  let priceYLabels: { val: number; y: number }[] = [];

  if (hasPriceData && asset) {
    const pd = intradayPrices!.filter((p) => p.ts * 1000 >= xStart && p.ts * 1000 <= xEnd);
    if (pd.length >= 2) {
      const prices = pd.map((p) => p.price);
      const pMin = Math.min(...prices);
      const pMax = Math.max(...prices);
      const pPad = (pMax - pMin) * 0.1 || 1;
      const pMinP = pMin - pPad;
      const pMaxP = pMax + pPad;
      const pRange = pMaxP - pMinP || 1;
      const pricePoints = pd.map((p) => ({
        x: timeToX(p.ts * 1000, xStart, xSpan, chartW, PAD.left),
        y: PAD.top + chartH - ((p.price - pMinP) / pRange) * chartH,
      }));
      priceLine = pointsToPath(pricePoints);
      priceYLabels = yAxisLabels(pMinP, pRange, 5, PAD.top, chartH);
    }
  }

  const yLabels = yAxisLabels(bMin, bRange, 5, PAD.top, chartH).map((l) => ({ ...l, val: Math.round(l.val) }));
  const fiftyY = PAD.top + chartH - ((50 - bMin) / bRange) * chartH;

  const xHours = Math.round(xSpan / 3600000);
  const xSteps = Math.min(xHours, 7);
  const xLabels = Array.from({ length: xSteps + 1 }, (_, i) => ({
    x: PAD.left + (i / xSteps) * chartW,
    time: fmtTime(new Date(xStart + (i / xSteps) * xSpan).toISOString()),
  }));

  // Build HTML overlay markers — positioned ON the bias line
  const biasTimeSeries = biasData.map((h) => ({ t: new Date(h.created_at).getTime(), score: h.score }));
  const htmlMarkers: BiasMarker[] = (signals ?? [])
    .filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= xStart && t <= xEnd;
    })
    .map((s) => {
      const t = new Date(s.created_at).getTime();
      const score = interpolateScore(t, biasTimeSeries);
      const svgX = timeToX(t, xStart, xSpan, chartW, PAD.left);
      const svgY = PAD.top + chartH - ((score - bMin) / bRange) * chartH;
      return { ...s, pctX: (svgX / W) * 100, pctY: (svgY / H) * 100 };
    });

  const hasAnyPriceData = (intradayPrices?.length ?? 0) >= 2;
  const showClosedNote = hasAnyPriceData && (now / 1000 - intradayPrices![intradayPrices!.length - 1].ts) > 3600;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <ChartHeader lineColor={lineColor} hasPriceData={hasPriceData} showClosedNote={showClosedNote} />
        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
            {yLabels.map((yl) => (
              <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <line x1={PAD.left} y1={fiftyY} x2={W - PAD.right} y2={fiftyY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />
            {biasArea && <path d={biasArea} fill={fillColor} />}
            {biasLine && <path d={biasLine} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
            {hasPriceData && priceLine && (
              <path d={priceLine} fill="none" stroke="#2962FF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" />
            )}
            {biasPoints.length > 0 && (
              <>
                <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
                <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.2" />
              </>
            )}
            {yLabels.map((yl) => (
              <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end" className="fill-white/20 font-mono text-[10px]">{yl.val}%</text>
            ))}
            {hasPriceData && priceYLabels.map((pl, i) => (
              <text key={`p-${i}`} x={W - PAD.right + 6} y={pl.y + 3} textAnchor="start" className="fill-[#2962FF]/40 font-mono text-[9px]">
                {asset === "Oil" ? pl.val.toFixed(1) : pl.val.toFixed(0)}
              </text>
            ))}
            {xLabels.map((xl, i) => (
              <text key={i} x={xl.x} y={H - 4} textAnchor="middle" className="fill-white/20 font-mono text-[10px]">{xl.time}</text>
            ))}
          </svg>
          <BiasChartMarkers markers={htmlMarkers} />
        </div>
      </div>
    </div>
  );
}

function ChartHeader({ lineColor, hasPriceData, showClosedNote }: { lineColor: string; hasPriceData: boolean; showClosedNote: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Bias-trend 6h</h4>
        {showClosedNote && <span className="font-sans text-[9px] text-white/20">· Börsen stängd</span>}
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
  );
}
