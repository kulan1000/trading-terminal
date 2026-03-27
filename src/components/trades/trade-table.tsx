import type { TradeRow } from "@/lib/queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TradeTable({ trades, title }: { trades: TradeRow[]; title: string }) {
  if (!trades.length) {
    return (
      <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-terminal-muted">{title}</h3>
        <p className="text-sm text-terminal-muted">No trades yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-terminal-border bg-terminal-surface p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-terminal-border text-left text-xs text-terminal-muted">
              <th className="pb-2">Asset</th>
              <th className="pb-2">Dir</th>
              <th className="pb-2 text-right">Entry</th>
              <th className="pb-2 text-right">Exit</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">P&L</th>
              <th className="pb-2 text-right">Opened</th>
              {title.toLowerCase().includes("closed") && <th className="pb-2 text-right">Closed</th>}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const dirColor = t.direction === "long" ? "text-terminal-green" : "text-terminal-red";
              const pnlColor = (t.pnl ?? 0) >= 0 ? "text-terminal-green" : "text-terminal-red";
              const pnlSign = (t.pnl ?? 0) >= 0 ? "+" : "";

              return (
                <tr key={t.id} className="border-b border-terminal-border/50">
                  <td className="py-2 font-semibold text-terminal-text">{t.asset}</td>
                  <td className={`py-2 uppercase ${dirColor}`}>{t.direction}</td>
                  <td className="py-2 text-right text-terminal-text">{formatPrice(t.entry_price)}</td>
                  <td className="py-2 text-right text-terminal-text">
                    {t.exit_price ? formatPrice(t.exit_price) : "—"}
                  </td>
                  <td className="py-2 text-right text-terminal-muted">{t.quantity}</td>
                  <td className={`py-2 text-right font-semibold ${pnlColor}`}>
                    {t.pnl != null ? `${pnlSign}$${t.pnl.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2 text-right text-terminal-muted">{formatDate(t.opened_at)}</td>
                  {title.toLowerCase().includes("closed") && (
                    <td className="py-2 text-right text-terminal-muted">
                      {t.closed_at ? formatDate(t.closed_at) : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
