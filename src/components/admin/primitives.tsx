"use client";

/**
 * Small primitives shared across the admin drill-down.
 * Deliberately inlined (no external UI lib) so the look matches /market + /sentiment exactly.
 */

export function LiveDot({ color = "var(--color-tv-bull)" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full animate-ping-slow rounded-full opacity-50"
        style={{ background: color }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function Chip({
  tone = "muted",
  children,
}: {
  tone?: "bull" | "bear" | "warn" | "blue" | "muted";
  children: React.ReactNode;
}) {
  const map: Record<string, { bg: string; color: string }> = {
    bull: { bg: "rgba(38,166,154,0.12)", color: "var(--color-tv-bull)" },
    bear: { bg: "rgba(239,83,80,0.12)", color: "var(--color-tv-bear)" },
    warn: { bg: "rgba(255,152,0,0.12)", color: "var(--color-tv-orange)" },
    blue: { bg: "rgba(41,98,255,0.12)", color: "#8FB2FF" },
    muted: { bg: "rgba(255,255,255,0.04)", color: "var(--color-tv-secondary)" },
  };
  const { bg, color } = map[tone];
  return (
    <span className="chip" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o} data-active={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function BarChart({
  data,
  color = "#2962FF",
  height = 60,
  highlightIdx = -1,
}: {
  data: number[];
  color?: string;
  height?: number;
  highlightIdx?: number;
}) {
  if (!data?.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex w-full items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-colors"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: 2,
            background: i === highlightIdx ? "#2962FF" : color,
            opacity: i === highlightIdx ? 1 : 0.55,
          }}
        />
      ))}
    </div>
  );
}

export function DeltaChip({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (!isFinite(value)) return null;
  const up = value >= 0;
  const color = up ? "var(--color-tv-bull)" : "var(--color-tv-bear)";
  return (
    <span className="tick text-[11px] font-semibold" style={{ color }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="lbl" style={{ letterSpacing: "0.12em" }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--color-tv-border)" }} />
    </div>
  );
}
