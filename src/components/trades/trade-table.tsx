import type { TradeRow } from "@/lib/queries-trades";
import { changeColor } from "@/lib/utils";
import { fmtNum } from "@/lib/format-utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

export function TradeTable({ trades, title }: { trades: TradeRow[]; title: string }) {
  if (!trades.length) {
    return (
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-4">
        <h3 className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-tv-text-secondary">
          {title}
        </h3>
        <p className="text-sm text-tv-text-secondary">No trades yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4">
      <h3 className="mb-3 font-sans text-xs font-medium uppercase tracking-wider text-tv-text-secondary">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[13px]">
          <thead>
            <tr className="border-b border-tv-divider text-tv-text-secondary">
              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Asset</th>
              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider">Dir</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Entry</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Exit</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Qty</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">P&L</th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Opened</th>
              {title.toLowerCase().includes("closed") && (
                <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider">Closed</th>
              )}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const dirColor = t.direction === "long" ? "text-tv-green" : "text-tv-red";
              const pnlColor = changeColor(t.pnl ?? 0);
              const pnlSign = (t.pnl ?? 0) >= 0 ? "+" : "";

              return (
                <tr key={t.id} className="border-b border-tv-divider transition-colors hover:bg-tv-hover">
                  <td className="py-1.5 font-semibold text-tv-text">{t.asset}</td>
                  <td className={`py-1.5 uppercase ${dirColor}`}>{t.direction}</td>
                  <td className="py-1.5 text-right text-tv-text">{fmtNum(t.entry_price)}</td>
                  <td className="py-1.5 text-right text-tv-text">
                    {t.exit_price ? fmtNum(t.exit_price) : "—"}
                  </td>
                  <td className="py-1.5 text-right text-tv-text-secondary">{t.quantity}</td>
                  <td className={`py-1.5 text-right font-semibold ${pnlColor}`}>
                    {t.pnl != null ? `${pnlSign}$${t.pnl.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-1.5 text-right text-tv-text-subtle">{formatDate(t.opened_at)}</td>
                  {title.toLowerCase().includes("closed") && (
                    <td className="py-1.5 text-right text-tv-text-subtle">
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
