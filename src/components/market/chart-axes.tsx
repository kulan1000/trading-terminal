// SVG axis renderers for the expanded chart modal
import { fmtTimeEpoch } from "@/lib/format-utils";

/** Generate ~5 evenly-spaced "nice" price ticks between min and max */
export function priceTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  const nice = residual <= 1.5 ? 1 : residual <= 3 ? 2 : residual <= 7 ? 5 : 10;
  const step = nice * mag;
  const lo = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= max; v += step) ticks.push(v);
  return ticks;
}

interface TimeAxisProps {
  timestamps: number[];
  dataLength: number;
  toX: (i: number) => number;
  height: number;
}

export function TimeAxis({ timestamps, dataLength, toX, height: H }: TimeAxisProps) {
  if (timestamps.length <= 10) return null;

  const ticks = [];
  for (let i = 0; i <= 6; i++) {
    const idx = Math.round((i / 6) * (dataLength - 1));
    const ts = timestamps[idx];
    if (!ts) continue;
    const x = toX(idx);
    ticks.push(
      <g key={i}>
        <line x1={x} y1={H - 2} x2={x} y2={H + 4} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <text x={x} y={H + 14} textAnchor="middle"
          fill="#71717a" fontSize="9" fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif">
          {fmtTimeEpoch(ts)}
        </text>
      </g>
    );
  }
  return <>{ticks}</>;
}

interface PriceAxisProps {
  data: number[];
  toY: (v: number) => number;
  width: number;
  height: number;
}

export function PriceAxis({ data, toY, width: W, height: H }: PriceAxisProps) {
  const dMin = Math.min(...data);
  const dMax = Math.max(...data);
  const ticks = priceTicks(dMin, dMax);
  const decimals = dMax < 10 ? 2 : dMax < 100 ? 2 : dMax < 1000 ? 1 : 0;

  return (
    <>
      {ticks.map((v) => {
        const y = toY(v);
        if (y < 4 || y > H - 4) return null;
        return (
          <g key={v}>
            <line x1={0} y1={y} x2={W} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="4 6" opacity={0.5} />
            <rect x={W - 62} y={y - 8} width={58} height={16} rx={3}
              fill="rgba(10,10,14,0.75)" />
            <text x={W - 6} y={y + 3.5} textAnchor="end"
              fill="#a1a1aa" fontSize="9.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif">
              {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            </text>
          </g>
        );
      })}
    </>
  );
}
