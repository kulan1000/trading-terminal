"use client";

import { fmtAgoShort } from "@/lib/format-utils";

interface Classification {
  asset: string;
  direction: string;
  signal_type: string;
  confidence: number;
  author: string;
  interpretation: string | null;
  created_at: string;
}

const DIR_COLOR: Record<string, string> = {
  bullish: "text-[#26A69A]",
  bearish: "text-[#EF5350]",
  neutral: "text-[#FF9800]",
};

const DIR_BG: Record<string, string> = {
  bullish: "bg-[#26A69A]/10",
  bearish: "bg-[#EF5350]/10",
  neutral: "bg-[#FF9800]/10",
};

const TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-[#26A69A]/15 text-[#26A69A]" },
  exited: { label: "EXIT", cls: "bg-white/[0.04] text-white/40" },
  position: { label: "HOLD", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
  opinion: { label: "OPINION", cls: "bg-[#FF9800]/10 text-[#FF9800]" },
  target: { label: "TARGET", cls: "bg-[#FF9800]/10 text-[#FF9800]" },
};

export function RecentClassifications({ data }: { data: Classification[] }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-3">
        <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          Senaste klassificeringar
        </h2>
      </div>

      {!data.length ? (
        <div className="px-5 pb-4">
          <p className="font-sans text-[12px] text-white/25">Inga klassificeringar ännu</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="flex items-center border-y border-white/[0.04] bg-white/[0.015] px-5 py-2">
            <span className="w-12 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Asset</span>
            <span className="w-14 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Dir</span>
            <span className="w-16 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Type</span>
            <span className="w-10 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Conf</span>
            <span className="ml-3 flex-1 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Author</span>
            <span className="w-8 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Age</span>
          </div>

          <div>
            {data.map((c, i) => {
              const ts = TYPE_STYLE[c.signal_type] ?? TYPE_STYLE.opinion;
              return (
                <div key={i} className="flex items-center border-b border-white/[0.03] px-5 py-2.5 transition-colors hover:bg-white/[0.02]">
                  <span className="w-12 font-sans text-[11px] font-semibold text-white/60">
                    {c.asset.slice(0, 4)}
                  </span>
                  <span className={`w-14 font-sans text-[11px] font-bold ${DIR_COLOR[c.direction] ?? "text-white/40"}`}>
                    {c.direction.slice(0, 4).toUpperCase()}
                  </span>
                  <span className={`w-16 rounded-md px-1.5 py-0.5 text-center font-sans text-[9px] font-bold ${ts.cls}`}>
                    {ts.label}
                  </span>
                  <span className="w-10 text-right font-mono text-[11px] tabular-nums text-white/40">
                    {(c.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="ml-3 flex-1 truncate font-sans text-[11px] text-white/30">
                    @{c.author}
                  </span>
                  <span className="w-8 text-right font-mono text-[10px] text-white/20">
                    {fmtAgoShort(c.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
