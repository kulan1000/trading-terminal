"use client";

const TABLE_LABELS: Record<string, string> = {
  discord_messages: "Discord messages",
  signals: "Signals",
  bias_snapshots: "Bias snapshots",
  sentiment_snapshots: "Sentiment snapshots",
  price_snapshots: "Price snapshots",
  pipeline_runs: "Pipeline runs",
};

interface Props {
  tableCounts: Record<string, number>;
}

export function DatabaseInfo({ tableCounts }: Props) {
  const entries = Object.entries(tableCounts);
  const totalRows = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Database</h2>
          <span className="font-mono text-[10px] tabular-nums text-white/20">
            {totalRows.toLocaleString()} rows
          </span>
        </div>
        <div className="space-y-2.5">
          {entries.map(([table, count]) => {
            const maxCount = Math.max(...entries.map(([, c]) => c), 1);
            const pct = (count / maxCount) * 100;
            return (
              <div key={table} className="group">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-[11px] text-white/40">
                    {TABLE_LABELS[table] ?? table}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-white/50">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.03]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#FF9800]/30 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
