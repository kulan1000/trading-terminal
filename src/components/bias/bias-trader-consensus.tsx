"use client";

import Link from "next/link";
import { fmtAgoShort } from "@/lib/format-utils";
import type { TraderEntry } from "./bias-detail-types";

const DIR_DOT: Record<string, string> = {
  bullish: "bg-[#26A69A]", bearish: "bg-[#EF5350]", neutral: "bg-[#FF9800]",
};
const TYPE_TAG: Record<string, string> = {
  entry: "bg-[#26A69A]/15 text-[#26A69A]", exited: "bg-white/[0.04] text-white/40",
  position: "bg-[#2962FF]/15 text-[#2962FF]", opinion: "bg-[#FF9800]/10 text-[#FF9800]",
  target: "bg-[#2962FF]/15 text-[#2962FF]",
};

function traderFreshness(latestAt: string): string {
  const ageH = (Date.now() - new Date(latestAt).getTime()) / 3600000;
  if (ageH <= 1) return "opacity-100";
  if (ageH <= 3) return "opacity-70";
  return "opacity-40";
}

function credBadge(cred: TraderEntry["credibility"]): { label: string; color: string } | null {
  if (!cred || cred.totalScored < 3) return null;
  const wr = cred.winRate;
  if (wr >= 0.7) return { label: `${Math.round(wr * 100)}%`, color: "bg-[#26A69A]/20 text-[#26A69A]" };
  if (wr >= 0.5) return { label: `${Math.round(wr * 100)}%`, color: "bg-[#FF9800]/15 text-[#FF9800]" };
  return { label: `${Math.round(wr * 100)}%`, color: "bg-[#EF5350]/15 text-[#EF5350]" };
}

export function BiasTraderConsensus({ traders }: { traders: TraderEntry[] }) {
  const bulls = traders.filter((t) => t.direction === "bullish");
  const bears = traders.filter((t) => t.direction === "bearish");

  const renderSide = (list: TraderEntry[], label: string, color: string) => (
    <div className="flex-1">
      <h5 className={`mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] ${color}`}>
        {label} ({list.length})
      </h5>
      <div className="space-y-1.5">
        {list.slice(0, 6).map((t) => (
          <div key={t.author} className={`flex items-center gap-2 ${traderFreshness(t.latestAt)}`}>
            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${DIR_DOT[t.direction]}`} />
            <Link href={`/trader/${encodeURIComponent(t.author)}`} className="truncate font-sans text-[12px] font-medium text-white/70 hover:text-[#2962FF] hover:underline">
              {t.author}
            </Link>
            <div className="ml-auto flex items-center gap-1">
              {(() => {
                const badge = credBadge(t.credibility);
                return badge ? (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${badge.color}`} title={`Win rate: ${badge.label} (${t.credibility?.totalScored} scored)`}>
                    {badge.label}
                  </span>
                ) : null;
              })()}
              {t.types.slice(0, 2).map((ty) => (
                <span key={ty} className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[ty] ?? TYPE_TAG.opinion}`}>
                  {ty}
                </span>
              ))}
              <span className="font-mono text-[9px] text-white/20">{fmtAgoShort(t.latestAt)}</span>
              <span className="font-mono text-[10px] text-white/20">{t.count}x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Trader-konsensus
        </h4>
        <div className="flex gap-6">
          {renderSide(bulls, "Bullish", "text-[#26A69A]")}
          <div className="w-px bg-white/[0.06]" />
          {renderSide(bears, "Bearish", "text-[#EF5350]")}
        </div>
      </div>
    </div>
  );
}
