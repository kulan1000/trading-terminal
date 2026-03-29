"use client";

interface Props {
  hoverIdx: number;
  data: number[];
  hx: number;
  width: number;
  hTime: string | null;
}

export function ChartHoverTooltip({ hoverIdx, data, hx, width, hTime }: Props) {
  const price = data[hoverIdx];
  const openPrice = data[0];
  const diff = price - openPrice;

  return (
    <div
      className="pointer-events-none absolute top-4 rounded-md border border-white/[0.06] bg-[#111111]/95 px-3 py-1.5 font-sans tabular-nums text-xs shadow-lg backdrop-blur-sm"
      style={{
        left: hx > width * 0.75
          ? `calc(${(hx / width) * 100}% - 130px)`
          : `calc(${(hx / width) * 100}% + 12px)`,
      }}
    >
      <div className="font-semibold text-tv-text">
        {price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={diff >= 0 ? "text-terminal-green" : "text-terminal-red"}>
        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
      </div>
      {hTime && <div className="text-tv-muted">{hTime}</div>}
    </div>
  );
}
