"use client";

import { fmtTime } from "@/lib/format-utils";

export interface ScoreHistoryPoint {
  hour: string;       // ISO hour bucket
  avgScore: number;   // avg weighted_score for that hour
  count: number;      // number of signals scored
  wins: number;       // positive scores
  winRate: number;    // wins / count
}

interface Props {
  history: ScoreHistoryPoint[];
}

const W = 820;
const H = 200;
const PAD = { top: 16, right: 55, bottom: 30, left: 45 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

function pointsToPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const dx = (curr.x - prev.x) * 0.3;
    d += ` C${(prev.x + dx).toFixed(1)},${prev.y.toFixed(1)} ${(curr.x - dx).toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

export function ScoreTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 py-4">
          <h3 className="font-sans text-[13px] font-semibold text-white">
            Scoring Accuracy Timeline
          </h3>
          <p className="mt-2 font-sans text-[12px] text-white/40">
            Ingen scoring-data ännu. Tidslinjen fylls automatiskt när signaler börjar scornas efter marknadsöppning.
          </p>
        </div>
      </div>
    );
  }

  // Data range
  const times = history.map((h) => new Date(h.hour).getTime());
  const xStart = Math.min(...times);
  const xEnd = Math.max(...times);
  const xSpan = Math.max(xEnd - xStart, 3_600_000); // at least 1h

  const maxCount = Math.max(...history.map((h) => h.count), 1);
  const barH = CH * 0.25; // bottom 25% for volume bars

  // Map to screen coords
  const toX = (t: number) => PAD.left + ((t - xStart) / xSpan) * CW;
  const toY = (rate: number) => PAD.top + (1 - rate) * (CH - barH);

  // Win rate line points
  const linePoints = history.map((h) => ({
    x: toX(new Date(h.hour).getTime()),
    y: toY(h.winRate),
  }));

  // Volume bars
  const barWidth = Math.max(6, CW / Math.max(history.length, 1) * 0.6);

  // Y axis labels for win rate (0%–100%)
  const yLabels = [0, 25, 50, 75, 100].map((pct) => ({
    val: pct,
    y: toY(pct / 100),
  }));

  // X axis labels (show ~6 labels)
  const step = Math.max(1, Math.floor(history.length / 6));
  const xLabels = history.filter((_, i) => i % step === 0).map((h) => ({
    label: fmtTime(h.hour),
    x: toX(new Date(h.hour).getTime()),
  }));

  // Summary stats
  const totalSignals = history.reduce((s, h) => s + h.count, 0);
  const totalWins = history.reduce((s, h) => s + h.wins, 0);
  const overallRate = totalSignals > 0 ? Math.round((totalWins / totalSignals) * 100) : 0;

  const linePath = pointsToPath(linePoints);
  const gradientId = "score-timeline-grad";

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[13px] font-semibold text-white">
            Scoring Accuracy Timeline
          </h3>
          <div className="flex items-center gap-4 font-sans text-[11px] tabular-nums">
            <span className="text-white/40">
              {totalSignals} scored
            </span>
            <span className={overallRate >= 50 ? "text-[#26A69A]" : "text-[#EF5350]"}>
              {overallRate}% win rate
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#26A69A" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#26A69A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((l) => (
            <g key={l.val}>
              <line
                x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y}
                stroke="white" strokeOpacity={l.val === 50 ? 0.12 : 0.04}
                strokeDasharray={l.val === 50 ? "4,4" : "none"}
              />
              <text
                x={PAD.left - 8} y={l.y + 3}
                textAnchor="end"
                className="fill-white/30 font-sans text-[10px]"
              >
                {l.val}%
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x} y={H - 4}
              textAnchor="middle"
              className="fill-white/30 font-sans text-[10px]"
            >
              {l.label}
            </text>
          ))}

          {/* Volume bars */}
          {history.map((h, i) => {
            const x = toX(new Date(h.hour).getTime());
            const bh = (h.count / maxCount) * barH;
            return (
              <rect
                key={i}
                x={x - barWidth / 2}
                y={H - PAD.bottom - bh}
                width={barWidth}
                height={bh}
                rx={2}
                fill={h.winRate >= 0.5 ? "#26A69A" : "#EF5350"}
                fillOpacity={0.15}
              />
            );
          })}

          {/* Area fill under line */}
          {linePoints.length >= 2 && (
            <path
              d={`${linePath} L${linePoints[linePoints.length - 1].x},${H - PAD.bottom - barH} L${linePoints[0].x},${H - PAD.bottom - barH} Z`}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Win rate line */}
          {linePoints.length >= 2 && (
            <path
              d={linePath}
              fill="none"
              stroke="#26A69A"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {linePoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x} cy={p.y} r={3}
              fill="#111111"
              stroke={history[i].winRate >= 0.5 ? "#26A69A" : "#EF5350"}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
