"use client";

const COLORS: Record<string, { text: string; bg: string; badge: string }> = {
  green: { text: "text-[#26A69A]", bg: "bg-[#26A69A]/10", badge: "LIVE" },
  orange: { text: "text-[#FF9800]", bg: "bg-[#FF9800]/10", badge: "WARN" },
  red: { text: "text-[#EF5350]", bg: "bg-[#EF5350]/10", badge: "ALERT" },
  muted: { text: "text-white/40", bg: "bg-white/[0.04]", badge: "—" },
};

export function StatusCard({ label, value, color, sub }: {
  label: string; value: string | number; color: string; sub: string;
}) {
  const c = COLORS[color] ?? COLORS.muted;
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-center justify-between">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">{label}</p>
          <span className={`rounded-md px-1.5 py-0.5 font-sans text-[8px] font-bold ${c.bg} ${c.text}`}>
            {c.badge}
          </span>
        </div>
        <p className={`mt-2 font-mono text-[24px] font-bold tabular-nums ${c.text}`}>{value}</p>
        <p className="mt-1 font-sans text-[10px] text-white/25">{sub}</p>
      </div>
    </div>
  );
}
