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
      <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-6">
        <h3 className="mb-2 text-sm font-semibold text-terminal-muted">
          ⏳ OPEN POSITIONS
        </h3>
        <p className="text-xs text-zinc-500">Inga öppna positioner just nu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-terminal-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-terminal-muted">
        ⏳ OPEN POSITIONS
        <span className="ml-2 text-xs font-normal text-zinc-500">
          ({positions.length} — räknas ej i scoring)
        </span>
      </h3>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-terminal-muted">
            <th className="pb-2 text-left">Trader</th>
            <th className="pb-2 text-left">Asset</th>
            <th className="pb-2 text-left">Position</th>
            <th className="pb-2 text-right">Entry Price</th>
            <th className="pb-2 text-right">Opened</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="py-2 text-terminal-text">{p.author}</td>
              <td className="py-2 uppercase text-terminal-accent">{p.asset}</td>
              <td className="py-2">
                <span className={
                  p.position === "long"
                    ? "rounded bg-green-900/40 px-1.5 py-0.5 text-green-400"
                    : "rounded bg-red-900/40 px-1.5 py-0.5 text-red-400"
                }>
                  {p.position ?? "—"}
                </span>
              </td>
              <td className="py-2 text-right text-terminal-text">
                {p.price_at_signal != null ? `$${p.price_at_signal.toFixed(2)}` : "—"}
              </td>
              <td className="py-2 text-right text-zinc-500">{timeAgo(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
