"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Tiny SVG sparkline — no dependencies, pure path rendering */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + ((max - v) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Color based on first vs last value
  const isUp = data[data.length - 1] >= data[0];
  const stroke = isUp ? "var(--color-terminal-green)" : "var(--color-terminal-red)";
  const fill = isUp
    ? "var(--color-terminal-green)"
    : "var(--color-terminal-red)";

  // Gradient fill path (line + close to bottom)
  const fillPath = `M${points[0]} ${points.join(" L")} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <defs>
        <linearGradient id={`spark-${isUp ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.15} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={fillPath}
        fill={`url(#spark-${isUp ? "up" : "down"})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}
