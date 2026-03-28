// Tiny sparkline showing bias score history over last 24h
interface Point {
  score: number;
  direction: string;
  created_at: string;
}

const W = 80;
const H = 24;

export function BiasSparkline({ data }: { data: Point[] }) {
  if (data.length < 2) return null;

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.score - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = data[data.length - 1];
  const first = data[0];
  const trending = last.score > first.score ? "up" : last.score < first.score ? "down" : "flat";
  const color = trending === "up" ? "#34d399" : trending === "down" ? "#f87171" : "#a1a1aa";

  return (
    <div className="mt-2 flex items-center gap-2">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.8}
        />
        <circle
          cx={(data.length - 1) / (data.length - 1) * W}
          cy={H - ((last.score - min) / range) * H}
          r="2"
          fill={color}
        />
      </svg>
      <span className="text-[10px] text-tv-muted">24h</span>
    </div>
  );
}
