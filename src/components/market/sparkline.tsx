"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Intraday SVG sparkline with opening-price reference line */
export function Sparkline({
  data,
  width = 280,
  height = 64,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const toY = (v: number) => pad + ((max - v) / range) * (height - pad * 2);

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    return `${x.toFixed(1)},${toY(v).toFixed(1)}`;
  });

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp
    ? "var(--color-terminal-green)"
    : "var(--color-terminal-red)";

  // Opening price reference line
  const openY = toY(data[0]);

  // Gradient fill below line
  const fillPath = `M${points[0]} ${points.join(" L")} L${width},${height} L0,${height} Z`;

  // Unique ID per direction to avoid SVG gradient conflicts
  const gradId = `intra-${isUp ? "up" : "dn"}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Opening price dashed reference line */}
      <line
        x1={0}
        y1={openY}
        x2={width}
        y2={openY}
        stroke="var(--color-terminal-muted)"
        strokeWidth="0.5"
        strokeDasharray="4 3"
        opacity={0.4}
      />

      {/* Gradient fill */}
      <path d={fillPath} fill={`url(#${gradId})`} />

      {/* Price line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Current price dot */}
      <circle
        cx={width}
        cy={toY(data[data.length - 1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
