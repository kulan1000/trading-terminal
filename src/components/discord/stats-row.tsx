"use client";

interface StatsRowProps {
  total: number;
  processed: number;
  signals: number;
  /** Community bias from the daily briefing (bullish / bearish / neutral) */
  bias?: string;
  /** Asset the bias is most concentrated on — shown as subtitle on the bias card */
  dominantAsset?: string;
  /** Today's signal count — shown on the "Today" card if available */
  todaySignals?: number;
}

interface StatConfig {
  label: string;
  value: string;
  sub: string;
  valueCls: string;
  bias?: { label: string; cls: string; glow: string };
}

const BIAS: Record<string, { label: string; cls: string; glow: string }> = {
  bullish: {
    label: "▲ BULLISH",
    cls: "bg-[#26A69A]/15 text-[#26A69A]",
    glow: "shadow-[inset_-60px_0_60px_-20px_rgba(38,166,154,0.08)]",
  },
  bearish: {
    label: "▼ BEARISH",
    cls: "bg-[#EF5350]/15 text-[#EF5350]",
    glow: "shadow-[inset_-60px_0_60px_-20px_rgba(239,83,80,0.08)]",
  },
  neutral: {
    label: "— NEUTRAL",
    cls: "bg-[#FF9800]/15 text-[#FF9800]",
    glow: "",
  },
};

/**
 * Discord Intel header stats row (4 cards).
 * Matches Prototype v2 layout: Messages / Signals / Today / Community Bias.
 * The bias card glows toward its direction.
 */
export function StatsRow({
  total,
  processed,
  signals,
  bias,
  dominantAsset,
  todaySignals,
}: StatsRowProps) {
  const biasStyle = bias ? (BIAS[bias.toLowerCase()] ?? BIAS.neutral) : null;
  const hitRate = processed > 0 ? ((signals / processed) * 100).toFixed(1) : "0.0";

  const items: StatConfig[] = [
    {
      label: "Messages Ingested",
      value: total.toLocaleString(),
      sub: "all-time",
      valueCls: "text-white",
    },
    {
      label: "Signals Extracted",
      value: signals.toLocaleString(),
      sub: `${hitRate}% hit rate`,
      valueCls: "text-white",
    },
    {
      label: "Today's Signals",
      value: todaySignals != null ? todaySignals.toString() : "—",
      sub: "last 24h",
      valueCls: "text-[#26A69A]",
    },
    biasStyle
      ? {
          label: "Community Bias",
          value: "",
          sub: dominantAsset ? `mostly on ${dominantAsset}` : "across assets",
          valueCls: "",
          bias: biasStyle,
        }
      : {
          label: "Community Bias",
          value: "—",
          sub: "loading",
          valueCls: "text-white/40",
        },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`animate-fade-in relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-3 transition-colors hover:border-white/[0.12] hover:bg-[#151515] ${item.bias?.glow ?? ""}`}
        >
          <div className="font-sans text-[11px] font-medium text-white/40">{item.label}</div>
          {item.bias ? (
            <div className="mt-1.5">
              <span
                className={`inline-block rounded-md px-2.5 py-1 font-sans text-[13px] font-bold ${item.bias.cls}`}
              >
                {item.bias.label}
              </span>
            </div>
          ) : (
            <div
              className={`mt-1 font-mono text-[22px] font-bold tabular-nums tracking-tight ${item.valueCls}`}
            >
              {item.value}
            </div>
          )}
          <div className="mt-1 font-sans text-[11px] text-white/30">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
