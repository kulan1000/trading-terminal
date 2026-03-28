"use client";

interface HistoryPoint {
  score: number;
  direction: string;
  created_at: string;
}

const W = 820;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 30, left: 40 };

export function BiasDetailChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-tv-border bg-tv-surface">
        <span className="text-xs text-tv-secondary">Samlar data för graf...</span>
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

  // Area fill under curve
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD.top + chartH} L${PAD.left},${PAD.top + chartH} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.score > first.score;
  const lineColor = trending ? "#26a69a" : "#ef5350";
  const fillColor = trending ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";

  // Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = PAD.top + chartH - (i / 4) * chartH;
    return { val: Math.round(val), y };
  });

  // X-axis time labels (show ~5 evenly spaced)
  const xLabels = Array.from({ length: 5 }, (_, i) => {
    const idx = Math.round((i / 4) * (history.length - 1));
    const p = points[idx];
    const time = new Date(history[idx].created_at).toLocaleTimeString("sv-SE", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
    });
    return { x: p.x, time };
  });

  return (
    <div className="rounded-lg border border-tv-border bg-tv-surface p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-tv-heading">
        Bias-trend 24h
      </h4>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Grid lines */}
        {yLabels.map((yl) => (
          <line key={yl.val} x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Current dot */}
        <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
        <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.2" />

        {/* Y-axis labels */}
        {yLabels.map((yl) => (
          <text key={yl.val} x={PAD.left - 6} y={yl.y + 3} textAnchor="end" className="fill-tv-muted text-[10px] font-mono">
            {yl.val}%
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 4} textAnchor="middle" className="fill-tv-muted text-[10px] font-mono">
            {xl.time}
          </text>
        ))}
      </svg>
    </div>
  );
}
