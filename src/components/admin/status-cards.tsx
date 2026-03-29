"use client";

const COLORS: Record<string, { text: string; bg: string }> = {
  green: { text: "text-[#26A69A]", bg: "bg-[#26A69A]/10" },
  orange: { text: "text-[#FF9800]", bg: "bg-[#FF9800]/10" },
  red: { text: "text-[#EF5350]", bg: "bg-[#EF5350]/10" },
  muted: { text: "text-white/40", bg: "bg-white/5" },
};

const BADGE: Record<string, string> = {
  green: "OK", orange: "WARN", red: "ALERT", muted: "—",
};

export function StatusCard({ label, value, color, sub }: {
  label: string; value: string | number; color: string; sub: string;
}) {
  const c = COLORS[color] ?? COLORS.muted;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
      <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-mono text-[24px] font-bold tabular-nums ${c.text}`}>{value}</span>
        <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${c.bg} ${c.text}`}>
          {BADGE[color] ?? "—"}
        </span>
      </div>
      <p className="mt-1 font-sans text-[10px] text-white/25">{sub}</p>
    </div>
  );
}
