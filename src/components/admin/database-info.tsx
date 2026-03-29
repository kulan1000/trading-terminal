"use client";

const TABLE_LABELS: Record<string, string> = {
  discord_messages: "Discord-meddelanden",
  signals: "Signaler",
  bias_snapshots: "Bias-snapshots",
  sentiment_snapshots: "Sentiment-snapshots",
  price_snapshots: "Pris-snapshots",
  pipeline_runs: "Pipeline-körningar",
};

interface Props {
  tableCounts: Record<string, number>;
}

export function DatabaseInfo({ tableCounts }: Props) {
  const entries = Object.entries(tableCounts);
  const totalRows = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-[13px] font-medium text-white/70">Databas</h2>
        <span className="font-mono text-[10px] text-white/20">
          {totalRows.toLocaleString()} rader totalt
        </span>
      </div>
      <div className="space-y-1.5">
        {entries.map(([table, count]) => {
          const maxCount = Math.max(...entries.map(([, c]) => c), 1);
          const pct = (count / maxCount) * 100;
          return (
            <div key={table} className="flex items-center gap-3">
              <span className="w-36 shrink-0 font-sans text-[11px] text-white/40">
                {TABLE_LABELS[table] ?? table}
              </span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/[0.03]">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-[#2962FF]/20"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-white/50">
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
