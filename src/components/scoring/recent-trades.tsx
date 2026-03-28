"use client";

import type { ScoredSignal } from "@/hooks/use-scoring-data";

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-tv-text-subtle">—</span>;
  const color = value > 0 ? "text-tv-green" : value < 0 ? "text-tv-red" : "text-tv-text-secondary";
  return <span className={color}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentScored({ signals }: { signals: ScoredSignal[] }) {
  if (!signals.length) {
    return (
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-6">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Recent Scored
        </h3>
        <p className="text-xs text-tv-text-subtle">Inga scorade signaler ännu.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Recent Scored Signals
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-text-secondary">
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Trader</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Type</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Asset</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">30m</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">1h</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">2h</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">4h</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s, i) => (
            <tr key={i} className="border-b border-tv-divider transition-colors hover:bg-tv-hover">
              <td className="py-1.5 font-sans text-tv-text">{s.author}</td>
              <td className="py-1.5">
                <span className={
                  s.signalType === "entry"
                    ? "rounded bg-tv-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-tv-blue"
                    : "rounded bg-tv-orange/15 px-1.5 py-0.5 text-[10px] font-bold text-tv-orange"
                }>
                  {s.signalType === "entry" ? "ENTRY" : "EXIT"}
                  {s.position ? ` ${s.position.toUpperCase()}` : ""}
                </span>
              </td>
              <td className="py-1.5 uppercase text-tv-blue">{s.asset}</td>
              <td className="py-1.5 text-right"><ScoreCell value={s.score30m} /></td>
              <td className="py-1.5 text-right"><ScoreCell value={s.score1h} /></td>
              <td className="py-1.5 text-right"><ScoreCell value={s.score2h} /></td>
              <td className="py-1.5 text-right"><ScoreCell value={s.score4h} /></td>
              <td className="py-1.5 text-right">
                <ScoreCell value={s.weightedScore} />
                {s.consistent && <span className="ml-1 text-[9px] text-tv-green">✦</span>}
                <span className="ml-1.5 text-[10px] text-tv-text-subtle">{timeAgo(s.scoredAt)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
