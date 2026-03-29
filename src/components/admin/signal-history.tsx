"use client";

interface SignalRow {
  asset: string;
  direction: string;
  created_at: string;
}

interface DayBucket {
  date: string;
  label: string;
  gold: number;
  silver: number;
  oil: number;
  total: number;
}

const ASSET_COLOR: Record<string, string> = {
  gold: "#FFD700",
  silver: "#C0C5CE",
  oil: "#E8833A",
};

function bucketByDay(signals: SignalRow[]): DayBucket[] {
  const map = new Map<string, DayBucket>();

  for (const s of signals) {
    const d = new Date(s.created_at);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(date)) {
      const label = d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
      map.set(date, { date, label, gold: 0, silver: 0, oil: 0, total: 0 });
    }
    const b = map.get(date)!;
    const asset = s.asset?.toLowerCase() ?? "";
    if (asset === "gold") b.gold++;
    else if (asset === "silver") b.silver++;
    else if (asset === "oil") b.oil++;
    b.total++;
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function SignalHistory({ signals }: { signals: SignalRow[] }) {
  if (!signals.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Signaler per dag (7d)</h2>
          <p className="mt-3 font-sans text-[12px] text-white/25">Inga signaler tillgängliga.</p>
        </div>
      </div>
    );
  }

  const days = bucketByDay(signals);
  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  const totalSignals = signals.length;
  const avgPerDay = days.length > 0 ? Math.round(totalSignals / days.length) : 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Signaler per dag (7d)</h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tabular-nums text-white/25">
              {totalSignals} totalt · ~{avgPerDay}/dag
            </span>
          </div>
        </div>

        {/* Stacked bar chart */}
        <div className="flex items-end gap-1" style={{ height: 90 }}>
          {days.map((day, i) => {
            const h = Math.max(Math.round((day.total / maxTotal) * 80), 3);
            const goldH = day.total > 0 ? Math.round((day.gold / day.total) * h) : 0;
            const silverH = day.total > 0 ? Math.round((day.silver / day.total) * h) : 0;
            const oilH = h - goldH - silverH;
            return (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: 90 }}>
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-12 z-10 hidden rounded bg-[#1a1a1a] px-2 py-1.5 text-center shadow-lg group-hover:block">
                  <p className="whitespace-nowrap font-mono text-[9px] text-white/60">{day.label}</p>
                  <p className="whitespace-nowrap font-mono text-[9px]">
                    <span style={{ color: ASSET_COLOR.gold }}>Au {day.gold}</span>
                    {" · "}
                    <span style={{ color: ASSET_COLOR.silver }}>Ag {day.silver}</span>
                    {" · "}
                    <span style={{ color: ASSET_COLOR.oil }}>Oil {day.oil}</span>
                  </p>
                </div>
                {/* Stacked segments: Gold bottom, Silver middle, Oil top */}
                {oilH > 0 && (
                  <div className="w-full rounded-t-sm transition-all" style={{ height: oilH, background: `${ASSET_COLOR.oil}60` }} />
                )}
                {silverH > 0 && (
                  <div className="w-full transition-all" style={{ height: silverH, background: `${ASSET_COLOR.silver}50` }} />
                )}
                {goldH > 0 && (
                  <div className="w-full transition-all" style={{ height: goldH, background: `${ASSET_COLOR.gold}50` }} />
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-1 flex gap-1">
          {days.map((day, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="font-mono text-[8px] text-white/20">{day.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4">
          {(["gold", "silver", "oil"] as const).map((asset) => (
            <div key={asset} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: ASSET_COLOR[asset] }} />
              <span className="font-sans text-[10px] capitalize text-white/25">{asset}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
