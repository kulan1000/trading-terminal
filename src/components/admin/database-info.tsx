"use client";

interface Props {
  tableCounts: Record<string, number>;
}

const LABEL: Record<string, string> = {
  discord_messages: "discord_messages",
  signals: "signals",
  bias_snapshots: "bias_snapshots",
  sentiment_snapshots: "sentiment_snapshots",
  price_snapshots: "price_snapshots",
  pipeline_runs: "pipeline_runs",
};

export function DatabaseInfo({ tableCounts }: Props) {
  const entries = Object.entries(tableCounts);
  if (!entries.length) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-white/30">No tables to show.</div>
    );
  }

  return (
    <div>
      {entries.map(([table, count]) => {
        const health = count > 0 ? "ok" : "warn";
        return (
          <div
            key={table}
            className="flex items-center gap-3 border-b px-4 py-2.5 hover:bg-white/[0.02]"
            style={{ borderColor: "var(--color-tv-border)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: health === "ok" ? "var(--color-tv-bull)" : "var(--color-tv-orange)",
              }}
            />
            <span className="flex-1 font-mono text-[12px] text-white">
              {LABEL[table] ?? table}
            </span>
            <span className="tick w-24 text-right text-[12px] text-white">
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
