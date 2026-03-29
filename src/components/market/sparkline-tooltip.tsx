interface SparklineTooltipProps {
  price: number;
  change: number;
  changePct: number;
  time: string | null;
  x: number;
  width: number;
}

const TIP_WIDTH = 105;

export function SparklineTooltip({ price, change, changePct, time, x, width }: SparklineTooltipProps) {
  const flip = x > width - TIP_WIDTH - 10;
  const pctX = (x / width) * 100;

  return (
    <div
      className="pointer-events-none absolute top-0 rounded border border-white/[0.06] bg-[#111111]/95 px-2 py-1 font-sans tabular-nums text-[10px] leading-tight shadow-lg backdrop-blur-sm"
      style={{
        left: flip
          ? `calc(${pctX}% - ${TIP_WIDTH + 4}px)`
          : `calc(${pctX}% + 6px)`,
      }}
    >
      <div className="font-semibold text-white">
        {price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style={{ color: change >= 0 ? "#26A69A" : "#EF5350" }}>
        {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
      </div>
      {time && <div style={{ color: "rgba(255,255,255,0.3)" }}>{time}</div>}
    </div>
  );
}
