"use client";

interface HistoryRun {
  started_at: string;
  status: string;
  duration_ms: number | null;
  signals: number;
}

interface Bucket {
  label: string;
  total: number;
  success: number;
  errors: number;
  avgMs: number;
  signals: number;
}

function bucketRuns(runs: HistoryRun[]): Bucket[] {
  const map = new Map<string, HistoryRun[]>();

  for (const r of runs) {
    const d = new Date(r.started_at);
    // Group by 6-hour blocks: 00-05, 06-11, 12-17, 18-23
    const block = Math.floor(d.getHours() / 6) * 6;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(block).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const buckets: Bucket[] = [];
  for (const [key, group] of map) {
    const d = new Date(key + ":00:00");
    const block = d.getHours();
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    const label = `${dayLabel} ${String(block).padStart(2, "0")}–${String(block + 5).padStart(2, "0")}`;

    const success = group.filter((r) => r.status === "success").length;
    const durations = group.filter((r) => r.duration_ms != null).map((r) => r.duration_ms!);
    const avgMs = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const signals = group.reduce((s, r) => s + (r.signals ?? 0), 0);

    buckets.push({
      label,
      total: group.length,
      success,
      errors: group.length - success,
      avgMs,
      signals,
    });
  }

  return buckets;
}

export function PipelineHistory({ runs }: { runs: HistoryRun[] }) {
  if (!runs.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Pipeline history (7d)</h2>
          <p className="mt-3 font-sans text-[12px] text-white/25">No history available.</p>
        </div>
      </div>
    );
  }

  const buckets = bucketRuns(runs);
  const maxTotal = Math.max(...buckets.map((b) => b.total), 1);
  const totalRuns = runs.length;
  const totalSuccess = runs.filter((r) => r.status === "success").length;
  const overallRate = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;
  const totalSignals = runs.reduce((s, r) => s + (r.signals ?? 0), 0);

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Pipeline history (7d)</h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tabular-nums text-white/25">
              {totalRuns} runs · {totalSignals} signals
            </span>
            <span className={`rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${overallRate >= 95 ? "bg-[#26A69A]/15 text-[#26A69A]" : overallRate >= 80 ? "bg-[#FF9800]/15 text-[#FF9800]" : "bg-[#EF5350]/15 text-[#EF5350]"}`}>
              {overallRate}% OK
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-[2px]" style={{ height: 80 }}>
          {buckets.map((b, i) => {
            const h = Math.max(Math.round((b.total / maxTotal) * 72), 2);
            const successH = b.total > 0 ? Math.round((b.success / b.total) * h) : 0;
            const errorH = h - successH;
            const rate = b.total > 0 ? Math.round((b.success / b.total) * 100) : 0;
            return (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: 80 }}>
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 z-10 hidden rounded bg-[#1a1a1a] px-2 py-1 text-center shadow-lg group-hover:block">
                  <p className="whitespace-nowrap font-mono text-[9px] text-white/60">{b.label}</p>
                  <p className="whitespace-nowrap font-mono text-[9px] text-white/40">
                    {rate}% · {b.total} runs · {(b.avgMs / 1000).toFixed(1)}s avg
                  </p>
                </div>
                {/* Stacked bar */}
                {errorH > 0 && (
                  <div className="w-full rounded-t-sm bg-[#EF5350]/50 transition-all" style={{ height: errorH }} />
                )}
                <div
                  className={`w-full transition-all ${errorH > 0 ? "" : "rounded-t-sm"} ${rate === 100 ? "bg-[#26A69A]/40" : "bg-[#26A69A]/30"}`}
                  style={{ height: successH }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels — show every 4th bucket */}
        <div className="mt-1 flex gap-[2px]">
          {buckets.map((b, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 4 === 0 ? (
                <span className="font-mono text-[8px] text-white/15">{b.label.split(" ")[0]}</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#26A69A]/40" />
            <span className="font-sans text-[10px] text-white/25">Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#EF5350]/50" />
            <span className="font-sans text-[10px] text-white/25">Error</span>
          </div>
          <span className="ml-auto font-mono text-[9px] text-white/15">6-hour blocks</span>
        </div>
      </div>
    </div>
  );
}
