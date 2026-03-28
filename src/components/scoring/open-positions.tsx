"use client";

import type { OpenPosition } from "@/hooks/use-scoring-data";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function OpenPositions({ positions }: { positions: OpenPosition[] }) {
  if (!positions.length) {
    return (
      <div className="rounded-lg border border-tv-border bg-tv-surface p-5">
        <h3 className="mb-2 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
          Open Positions
        </h3>
        <p className="text-xs text-tv-muted">Inga öppna positioner just nu.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        Open Positions
        <span className="ml-2 text-[11px] font-normal text-tv-muted">
          ({positions.length} — räknas ej i scoring)
        </span>
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-secondary">
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Trader</th>
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Asset</th>
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Position</th>
            <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em]">Entry Price</th>
            <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em]">Opened</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-b border-tv-divider transition-colors hover:bg-tv-elevated">
              <td className="py-1.5 font-sans text-tv-text">{p.author}</td>
              <td className="py-1.5 uppercase text-tv-blue">{p.asset}</td>
              <td className="py-1.5">
                <span className={
                  p.position === "long"
                    ? "rounded bg-tv-bull/15 px-1.5 py-0.5 text-tv-bull"
                    : "rounded bg-tv-bear/15 px-1.5 py-0.5 text-tv-bear"
                }>
                  {p.position ?? "—"}
                </span>
              </td>
              <td className="py-1.5 text-right text-tv-text">
                {p.price_at_signal != null ? `$${p.price_at_signal.toFixed(2)}` : "—"}
              </td>
              <td className="py-1.5 text-right text-tv-muted">{timeAgo(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
