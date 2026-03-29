"use client";

import { fmtTimeFull } from "@/lib/format-utils";

interface PipelineRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: string;
  market_open: boolean | null;
  ingested: number;
  processed: number;
  signals: number;
  skipped: number;
  scored: number;
  openai_calls: number;
  error_message: string | null;
}

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  success: { dot: "bg-[#26A69A]", text: "text-[#26A69A]" },
  error: { dot: "bg-[#EF5350]", text: "text-[#EF5350]" },
  running: { dot: "bg-[#2962FF] animate-pulse", text: "text-[#2962FF]" },
};

export function PipelineLog({ runs }: { runs: PipelineRun[] }) {
  if (!runs.length) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Pipeline-logg</h2>
          <p className="mt-3 font-sans text-[12px] text-white/25">Inga körningar loggade ännu.</p>
        </div>
      </div>
    );
  }

  const successRate = runs.length > 0
    ? Math.round((runs.filter((r) => r.status === "success").length / runs.length) * 100)
    : 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Pipeline-logg</h2>
          <div className="flex items-center gap-3">
            {/* Mini success-rate dots */}
            <div className="flex items-center gap-0.5">
              {runs.slice(0, 20).reverse().map((r, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${r.status === "success" ? "bg-[#26A69A]/60" : r.status === "error" ? "bg-[#EF5350]/60" : "bg-[#2962FF]/40"}`}
                  title={`${fmtTimeFull(r.started_at)} — ${r.status}`}
                />
              ))}
            </div>
            <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums ${successRate >= 90 ? "bg-[#26A69A]/15 text-[#26A69A]" : successRate >= 70 ? "bg-[#FF9800]/15 text-[#FF9800]" : "bg-[#EF5350]/15 text-[#EF5350]"}`}>
              {successRate}% OK
            </span>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center border-y border-white/[0.04] bg-white/[0.015] px-5 py-2">
        <span className="w-5" />
        <span className="w-16 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Time</span>
        <span className="w-16 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Status</span>
        <span className="w-14 text-right font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Dur</span>
        <span className="ml-3 flex-1 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">Details</span>
      </div>

      <div>
        {runs.map((run) => {
          const s = STATUS_STYLE[run.status] ?? STATUS_STYLE.error;
          return (
            <div key={run.id} className="flex items-center border-b border-white/[0.03] px-5 py-2.5 transition-colors hover:bg-white/[0.02]">
              <span className={`mr-3 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              <span className="w-16 shrink-0 font-mono text-[10px] text-white/40">
                {fmtTimeFull(run.started_at)}
              </span>
              <span className={`w-16 shrink-0 font-sans text-[10px] font-bold ${s.text}`}>
                {run.status.toUpperCase()}
              </span>
              <span className="w-14 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/25">
                {run.duration_ms != null
                  ? run.duration_ms < 1000 ? `${run.duration_ms}ms` : `${(run.duration_ms / 1000).toFixed(1)}s`
                  : "—"}
              </span>
              <span className="ml-3 flex flex-1 gap-2 font-mono text-[9px] text-white/20">
                {run.ingested > 0 && <span>+{run.ingested} msg</span>}
                {run.processed > 0 && <span>{run.processed} proc</span>}
                {run.signals > 0 && <span className="text-[#26A69A]/60">{run.signals} sig</span>}
                {run.scored > 0 && <span>{run.scored} scored</span>}
                {run.market_open === false && <span className="text-[#FF9800]/50">CLOSED</span>}
              </span>
              {run.error_message && (
                <span className="ml-auto max-w-[200px] truncate font-mono text-[9px] text-[#EF5350]/50">
                  {run.error_message}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
