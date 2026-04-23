"use client";

export interface TradePairRow {
  author: string;
  asset: string;
  position: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TradePairs({ pairs }: { pairs: TradePairRow[] }) {
  if (!pairs.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Trade Pairs
          </h3>
        </div>
        <div className="px-5 pb-4">
          <p className="font-sans text-[13px] text-white/40">
            No matched trades yet. Pairing happens automatically when a trader posts both entry and exit on the same asset.
          </p>
        </div>
      </div>
    );
  }

  const totalPnl = pairs.reduce((sum, p) => sum + p.pnl, 0);
  const wins = pairs.filter((p) => p.pnl > 0).length;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Trade Pairs
          <span className="ml-2 font-sans text-[11px] font-normal text-white/30">
            {pairs.length} trades
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className={`font-sans text-[13px] tabular-nums ${totalPnl >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} PnL
          </span>
          <span className="font-sans text-[11px] tabular-nums text-white/30">
            {wins}W / {pairs.length - wins}L
          </span>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#111111]">
            <tr className="border-y border-white/[0.04] bg-white/[0.015]">
              <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Trader</th>
              <th className="px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Asset</th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Entry</th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Exit</th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">PnL</th>
              <th className="px-4 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">When</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.025] transition-colors">
                <td className="px-5 py-2.5 font-sans text-[13px] font-semibold text-white">{p.author}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-sans text-[11px] uppercase text-white/50">
                    {p.asset}
                  </span>
                  <span className="ml-1.5 text-[10px] text-white/25">{p.position}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-sans text-[12px] tabular-nums text-white/50">
                  ${p.entry_price.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-sans text-[12px] tabular-nums text-white/50">
                  ${p.exit_price.toFixed(2)}
                </td>
                <td className={`px-4 py-2.5 text-right font-sans text-[13px] tabular-nums ${p.pnl > 0 ? "text-[#26A69A]" : p.pnl < 0 ? "text-[#EF5350]" : "text-white/50"}`}>
                  {p.pnl > 0 ? "+" : ""}{p.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-sans text-[11px] tabular-nums text-white/30">
                  {timeAgo(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
