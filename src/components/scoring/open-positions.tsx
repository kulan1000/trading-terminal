"use client";

import type { OpenPosition } from "@/hooks/use-scoring-data";
import { fmtAgoEn } from "@/lib/format-utils";

export function OpenPositions({ positions }: { positions: OpenPosition[] }) {
  if (!positions.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Open Positions
          </h3>
        </div>
        <div className="px-5 pb-4">
          <p className="font-sans text-[13px] text-white/40">Inga oppna positioner just nu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      {/* Glossy sheen */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Open Positions
          <span className="ml-2 font-sans text-[11px] font-normal text-white/30">
            ({positions.length} — raknas ej i scoring)
          </span>
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y border-white/[0.04] bg-white/[0.015]">
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Trader</th>
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Asset</th>
            <th className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Position</th>
            <th className="px-5 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Entry Price</th>
            <th className="px-5 py-2.5 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Opened</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.025]">
              <td className="px-5 py-3 font-sans text-[14px] font-semibold text-white">{p.author}</td>
              <td className="px-5 py-3 font-sans text-[13px] font-medium uppercase text-[#2962FF]">{p.asset}</td>
              <td className="px-5 py-3">
                <span className={
                  p.position === "long"
                    ? "rounded-md bg-[#26A69A]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase text-[#26A69A]"
                    : "rounded-md bg-[#EF5350]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase text-[#EF5350]"
                }>
                  {p.position ?? <span className="text-white/20">—</span>}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-mono text-[13px] tabular-nums text-white">
                {p.price_at_signal != null ? `$${p.price_at_signal.toFixed(2)}` : <span className="text-white/20">—</span>}
              </td>
              <td className="px-5 py-3 text-right font-mono text-[11px] text-white/20">{fmtAgoEn(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
