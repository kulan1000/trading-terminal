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
      className="pointer-events-none absolute top-0 rounded border border-terminal-border bg-terminal-surface/95 px-2 py-1 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-sm"
      style={{
        left: flip
          ? `calc(${pctX}% - ${TIP_WIDTH + 4}px)`
          : `calc(${pctX}% + 6px)`,
      }}
    >
      <div className="font-semibold text-terminal-text">
        {price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={change >= 0 ? "text-terminal-green" : "text-terminal-red"}>
        {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
      </div>
      {time && <div className="text-terminal-muted">{time} ET</div>}
    </div>
  );
}
