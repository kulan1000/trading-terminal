"use client";

import { useState, useRef, useCallback } from "react";
import { TimelineTooltip } from "./timeline-tooltip";

export interface ScoreHistoryPoint {
  hour: string;
  avgScore: number;
  count: number;
  wins: number;
  winRate: number;
}

interface Props {
  history: ScoreHistoryPoint[];
}

/* ── chart dimensions ── */
const W = 820;
const H = 200;
const PAD = { top: 16, right: 50, bottom: 28, left: 38 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;
const BAR_AREA = 40;

function fmtHour(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function pointsToPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dx = (curr.x - prev.x) * 0.3;
    d += ` C${(prev.x + dx).toFixed(1)},${prev.y.toFixed(1)} ${(curr.x - dx).toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

export function ScoreTimeline({ history }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const handleMouse = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || history.length < 2) return;
      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const idx = Math.round(((mx - PAD.left) / CW) * (history.length - 1));
      setHoverIdx(idx >= 0 && idx < history.length ? idx : null);
    },
    [history.length],
  );

  if (history.length === 0) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 py-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Scoring Accuracy Timeline
          </h3>
          <p className="mt-2 font-sans text-[12px] text-white/40">
            No scoring data yet. The timeline fills in automatically once signals start getting scored.
          </p>
        </div>
      </div>
    );
  }

  const totalSignals = history.reduce((s, h) => s + h.count, 0);
  const totalWins = history.reduce((s, h) => s + h.wins, 0);
  const overallRate = totalSignals > 0 ? Math.round((totalWins / totalSignals) * 100) : 0;
  const avgScore = history.reduce((s, h) => s + h.avgScore * h.count, 0) / Math.max(totalSignals, 1);
  const maxCount = Math.max(...history.map((h) => h.count), 1);

  const lineAreaH = CH - BAR_AREA;
  const toX = (i: number) => PAD.left + (i / Math.max(history.length - 1, 1)) * CW;
  const toY = (wr: number) => PAD.top + lineAreaH - wr * lineAreaH;

  const linePoints = history.map((h, i) => ({ x: toX(i), y: toY(h.winRate) }));
  const linePath = pointsToPath(linePoints);
  const areaPath = linePath
    ? `${linePath} L${linePoints[linePoints.length - 1].x.toFixed(1)},${toY(0).toFixed(1)} L${linePoints[0].x.toFixed(1)},${toY(0).toFixed(1)} Z`
    : "";

  const yLevels = [0, 25, 50, 75, 100];
  const yLabels = yLevels.map((v) => ({ val: v, y: toY(v / 100) }));
  const step = Math.max(1, Math.floor(history.length / 7));
  const xLabels = history
    .map((h, i) => ({ label: fmtHour(h.hour), x: toX(i), i }))
    .filter((_, i) => i === 0 || i === history.length - 1 || i % step === 0);

  const barTop = PAD.top + lineAreaH + 6;
  const barMaxH = BAR_AREA - 8;
  const barW = Math.max(2, CW / history.length - 1.5);
  const lineColor = overallRate >= 50 ? "#26A69A" : "#EF5350";

  const hp = hoverIdx !== null ? history[hoverIdx] : null;
  const hx = hoverIdx !== null ? toX(hoverIdx) : 0;
  const hy = hp ? toY(hp.winRate) : 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Scoring Timeline
          </h3>
          <div className="flex items-center gap-4 font-sans text-[11px] tabular-nums">
            <span className="text-white/40">{totalSignals} scored</span>
            <span className={overallRate >= 50 ? "text-[#26A69A]" : "text-[#EF5350]"}>
              {overallRate}% win rate
            </span>
            <span className={avgScore >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}>
              {avgScore >= 0 ? "+" : ""}{avgScore.toFixed(2)}% avg
            </span>
          </div>
        </div>

        <div className="relative mt-3">
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="overflow-visible"
            onMouseMove={handleMouse}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="score-tl-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {yLabels.map((yl) => (
              <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}

            <line x1={PAD.left} y1={toY(0.5)} x2={W - PAD.right} y2={toY(0.5)}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />

            {areaPath && <path d={areaPath} fill="url(#score-tl-grad)" />}
            {linePath && (
              <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2"
                strokeLinejoin="round" strokeLinecap="round" />
            )}

            {linePoints.length > 0 && (
              <>
                <circle cx={linePoints[linePoints.length - 1].x} cy={linePoints[linePoints.length - 1].y}
                  r="4" fill={lineColor} />
                <circle cx={linePoints[linePoints.length - 1].x} cy={linePoints[linePoints.length - 1].y}
                  r="7" fill={lineColor} opacity="0.2" />
              </>
            )}

            {history.map((h, i) => {
              const bh = Math.max(2, (h.count / maxCount) * barMaxH);
              return (
                <rect key={i} x={toX(i) - barW / 2} y={barTop + barMaxH - bh}
                  width={barW} height={bh} rx={1}
                  fill={h.winRate >= 0.5 ? "#26A69A" : "#EF5350"}
                  opacity={hoverIdx === i ? 0.5 : 0.15} />
              );
            })}

            {yLabels.map((yl) => (
              <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end"
                className="fill-white/20 font-mono text-[10px]">{yl.val}%</text>
            ))}
            {xLabels.map((xl) => (
              <text key={xl.i} x={xl.x} y={H - 2} textAnchor="middle"
                className="fill-white/20 font-mono text-[10px]">{xl.label}</text>
            ))}

            {hp && hoverIdx !== null && (
              <>
                <line x1={hx} y1={PAD.top} x2={hx} y2={barTop + barMaxH}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1={PAD.left} y1={hy} x2={W - PAD.right} y2={hy}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <circle cx={hx} cy={hy} r="5" fill={lineColor} stroke="#111111" strokeWidth="2" />
              </>
            )}
          </svg>

          {hp && hoverIdx !== null && (
            <TimelineTooltip point={hp} x={hx} y={hy}
              chartWidth={W} chartHeight={H}
              historyLength={history.length} hoverIdx={hoverIdx} />
          )}
        </div>

        <div className="mt-2 flex items-center gap-4 border-t border-white/[0.04] pt-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-[#26A69A]" />
            <span className="font-sans text-[10px] text-white/30">Win Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2 rounded-sm bg-white/10" />
            <span className="font-sans text-[10px] text-white/30">Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-px w-3 border-t border-dashed border-white/20" />
            <span className="font-sans text-[10px] text-white/30">50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
