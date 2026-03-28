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
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-6">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
          Open Positions
        </h3>
        <p className="text-xs text-tv-text-subtle">Inga öppna positioner just nu.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-tv-text-secondary">
        Open Positions
        <span className="ml-2 text-[11px] font-normal text-tv-text-subtle">
          ({positions.length} — räknas ej i scoring)
        </span>
      </h3>
      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="border-b border-tv-divider text-tv-text-secondary">
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Trader</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Asset</th>
            <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Position</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Entry Price</th>
            <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Opened</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-b border-tv-divider transition-colors hover:bg-tv-hover">
              <td className="py-1.5 font-sans text-tv-text">{p.author}</td>
              <td className="py-1.5 uppercase text-tv-blue">{p.asset}</td>
              <td className="py-1.5">
                <span className={
                  p.position === "long"
                    ? "rounded bg-tv-green/15 px-1.5 py-0.5 text-tv-green"
                    : "rounded bg-tv-red/15 px-1.5 py-0.5 text-tv-red"
                }>
                  {p.position ?? "—"}
                </span>
              </td>
              <td className="py-1.5 text-right text-tv-text">
                {p.price_at_signal != null ? `$${p.price_at_signal.toFixed(2)}` : "—"}
              </td>
              <td className="py-1.5 text-right text-tv-text-subtle">{timeAgo(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
