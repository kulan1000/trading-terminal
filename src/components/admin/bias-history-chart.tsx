"use client";

interface BiasPoint {
  asset: string;
  direction: string;
  score: number;
  created_at: string;
}

const ASSET_COLOR: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C0C0",
  Oil: "#E8833A",
};

const W = 700;
const H = 160;
const PAD = { top: 12, right: 50, bottom: 24, left: 36 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

export function BiasHistoryChart({ data }: { data: BiasPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#111111]">
        <p className="font-sans text-[12px] text-white/25">Ingen bias-historik ännu</p>
      </div>
    );
  }

  // Group by asset
  const byAsset: Record<string, BiasPoint[]> = {};
  for (const p of data) {
    (byAsset[p.asset] ??= []).push(p);
  }

  const allTimes = data.map((p) => new Date(p.created_at).getTime());
  const minT = Math.min(...allTimes);
  const maxT = Math.max(...allTimes);
  const spanT = maxT - minT || 1;

  const toX = (ms: number) => PAD.left + ((ms - minT) / spanT) * CHART_W;
  const toY = (score: number) => PAD.top + ((100 - score) / 100) * CHART_H;

  // Time labels (6 points)
  const timeLabels = [];
  for (let i = 0; i <= 5; i++) {
    const t = minT + (i / 5) * spanT;
    const d = new Date(t);
    const label = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    timeLabels.push({ x: toX(t), label });
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-[13px] font-medium text-white/70">Bias-historik (24h)</h2>
        <div className="flex gap-3">
          {Object.entries(ASSET_COLOR).map(([asset, color]) => (
            <div key={asset} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="font-sans text-[10px] text-white/40">{asset}</span>
            </div>
          ))}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* 50% line */}
        <line x1={PAD.left} y1={toY(50)} x2={W - PAD.right} y2={toY(50)}
          stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="4 4" opacity={0.4} />
        <text x={PAD.left - 6} y={toY(50) + 3} textAnchor="end"
          fill="#52525b" fontSize="9" fontFamily="ui-monospace, monospace">50</text>

        {/* Y labels */}
        {[0, 25, 75, 100].map((v) => (
          <text key={v} x={PAD.left - 6} y={toY(v) + 3} textAnchor="end"
            fill="#3f3f46" fontSize="8" fontFamily="ui-monospace, monospace">{v}</text>
        ))}

        {/* Time labels */}
        {timeLabels.map((t, i) => (
          <text key={i} x={t.x} y={H - 2} textAnchor="middle"
            fill="#52525b" fontSize="8" fontFamily="ui-monospace, monospace">{t.label}</text>
        ))}

        {/* Asset lines */}
        {Object.entries(byAsset).map(([asset, points]) => {
          const color = ASSET_COLOR[asset] ?? "#888";
          const sorted = [...points].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const pathD = sorted
            .map((p, i) => {
              const x = toX(new Date(p.created_at).getTime());
              const y = toY(p.score);
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");

          const last = sorted[sorted.length - 1];
          const lastX = toX(new Date(last.created_at).getTime());
          const lastY = toY(last.score);

          return (
            <g key={asset}>
              <polyline points="" fill="none" />
              <path d={pathD} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
              <circle cx={lastX} cy={lastY} r="3" fill={color} />
              <text x={lastX + 6} y={lastY + 3}
                fill={color} fontSize="9" fontFamily="ui-monospace, monospace" opacity={0.9}>
                {last.score}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
