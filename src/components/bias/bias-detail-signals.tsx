"use client";

import Link from "next/link";
import type { DetailSignal } from "./bias-detail-types";
import { fmtTime, fmtAgo } from "@/lib/format-utils";

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  position: { label: "HOLD", cls: "bg-[#2962FF]/15 text-[#2962FF] ring-1 ring-[#2962FF]/30" },
  opinion: { label: "OPINION", cls: "bg-[#FF9800]/15 text-[#FF9800]" },
};


function groupByTime(signals: DetailSignal[]) {
  const now = Date.now();
  const groups: { label: string; signals: DetailSignal[] }[] = [
    { label: "Senaste timmen", signals: [] },
    { label: "1–3 timmar sedan", signals: [] },
    { label: "3–6 timmar sedan", signals: [] },
  ];

  for (const s of signals) {
    const age = (now - new Date(s.created_at).getTime()) / 3600000;
    if (age < 1) groups[0].signals.push(s);
    else if (age < 3) groups[1].signals.push(s);
    else groups[2].signals.push(s);
  }

  return groups.filter((g) => g.signals.length > 0);
}

function signalFreshness(iso: string): string {
  const ageH = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (ageH <= 1) return "opacity-100 border-l-[3px]";
  if (ageH <= 3) return "opacity-80 border-l-2";
  return "opacity-50 border-l-2";
}

function SignalCard({ s }: { s: DetailSignal }) {
  const dirBorder = s.direction === "bullish" ? "border-l-[#26A69A]" : s.direction === "bearish" ? "border-l-[#EF5350]" : "border-l-[#FF9800]";
  const typeInfo = TYPE_LABELS[s.signal_type ?? "opinion"] ?? TYPE_LABELS.opinion;
  const isStrong = s.strength === "strong";
  const freshness = signalFreshness(s.created_at);

  return (
    <div className={`rounded-lg border border-white/[0.04] ${dirBorder} bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.035] hover:opacity-100 ${isStrong ? "ring-1 ring-[#2962FF]/15" : ""} ${freshness}`}>
      <div className="flex items-center gap-2">
        <Link href={`/trader/${encodeURIComponent(s.author)}`} className="font-sans text-[13px] font-semibold text-white hover:text-[#2962FF] hover:underline">
          {s.author}
        </Link>
        <span className={`rounded-md px-2 py-0.5 font-sans text-[10px] font-bold ${typeInfo.cls}`}>
          {typeInfo.label}
        </span>
        {s.position && (
          <span className={`font-sans text-[10px] font-bold ${s.position === "long" ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
            {s.position.toUpperCase()}
          </span>
        )}
        {isStrong && (
          <span className="rounded-md bg-[#2962FF]/10 px-2 py-0.5 font-sans text-[10px] font-bold text-[#2962FF]">
            STARK
          </span>
        )}
        <span className="ml-auto font-mono text-[11px] text-white/20">
          {fmtTime(s.created_at)} <span className="text-[10px]">({fmtAgo(s.created_at)})</span>
        </span>
      </div>

      {s.content && (
        <p className="mt-2 rounded-lg bg-white/[0.02] px-3 py-2 font-sans text-[12px] leading-relaxed text-white/60">
          &ldquo;{s.content}&rdquo;
        </p>
      )}

      {s.interpretation && (
        <p className="mt-1.5 font-sans text-[11px] italic text-white/40">&rarr; {s.interpretation}</p>
      )}
    </div>
  );
}

export function BiasDetailSignals({ signals }: { signals: DetailSignal[] }) {
  if (!signals.length) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 pt-4 pb-4">
          <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Signaler</h4>
          <p className="mt-2 font-sans text-[12px] italic text-white/30">Inga signaler senaste 6h.</p>
        </div>
      </div>
    );
  }

  const groups = groupByTime(signals);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-5">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Signaler senaste 6h ({signals.length})
        </h4>
        <div className="max-h-[350px] space-y-4 overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{g.label}</span>
                <span className="font-mono text-[10px] text-white/20">({g.signals.length})</span>
                <div className="flex-1 border-t border-white/[0.04]" />
              </div>
              <div className="space-y-2">
                {g.signals.map((s) => <SignalCard key={s.id} s={s} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
