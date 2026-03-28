"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtAgo, fmtPrice } from "@/lib/format-utils";

interface Credibility {
  discord_user: string;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
  score: number;
}

interface Profile {
  author: string;
  total_signals: number;
  primary_asset: string;
  primary_direction: string;
  assets_traded: string[];
  avg_confidence: number;
}

interface Signal {
  id: number;
  asset: string;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string;
  position: string | null;
  created_at: string;
}

interface Score {
  signal_id: number;
  asset: string;
  signal_type: string;
  position: string | null;
  price_at_signal: number;
  score_30m: number | null;
  score_1h: number | null;
  score_2h: number | null;
  score_4h: number | null;
  weighted_score: number;
  consistency_bonus: boolean;
  scored_at: string;
}

interface AssetBreakdown {
  [asset: string]: { total: number; bullish: number; bearish: number; entries: number; exits: number };
}

interface TraderData {
  author: string;
  credibility: Credibility | null;
  profile: Profile | null;
  signals: Signal[];
  scores: Score[];
  messages: { id: number; content: string; channel: string; timestamp: string }[];
  assetBreakdown: AssetBreakdown;
}

const DIR_CLR: Record<string, string> = {
  bullish: "text-[#26A69A]", bearish: "text-[#EF5350]", neutral: "text-[#FF9800]",
};
const DIR_BG: Record<string, string> = {
  bullish: "bg-[#26A69A]/15 text-[#26A69A]", bearish: "bg-[#EF5350]/15 text-[#EF5350]", neutral: "bg-[#FF9800]/15 text-[#FF9800]",
};
const TYPE_TAG: Record<string, string> = {
  entry: "bg-[#26A69A]/15 text-[#26A69A]", exited: "bg-white/[0.06] text-white/40",
  position: "bg-[#2962FF]/15 text-[#2962FF]", opinion: "bg-[#FF9800]/10 text-[#FF9800]",
  target: "bg-[#2962FF]/15 text-[#2962FF]",
};

export function TraderProfileView({ author }: { author: string }) {
  const [data, setData] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trader/${encodeURIComponent(author)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [author]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-pulse font-sans text-[13px] text-white/30">Laddar traderprofil...</span>
      </div>
    );
  }

  if (!data) {
    return <p className="py-20 text-center font-sans text-[13px] text-white/30">Kunde inte ladda data.</p>;
  }

  const cred = data.credibility;
  const prof = data.profile;

  return (
    <div className="space-y-5">
      {/* Back link + header */}
      <div className="flex items-center gap-3">
        <Link href="/sentiment" className="font-sans text-[12px] text-white/30 hover:text-white/60 transition-colors">
          ← Community Sentiment
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] font-sans text-[18px] font-bold text-white/60">
          {author.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-sans text-[20px] font-bold text-white">{author}</h1>
          {prof && (
            <p className="font-sans text-[12px] text-white/40">
              Primär: {prof.primary_asset} · {prof.primary_direction} · {prof.assets_traded.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards cred={cred} prof={prof} scores={data.scores} />

      {/* Asset breakdown */}
      {Object.keys(data.assetBreakdown).length > 0 && (
        <AssetBreakdownSection breakdown={data.assetBreakdown} />
      )}

      {/* Recent scored signals */}
      {data.scores.length > 0 && <ScoredSignals scores={data.scores} />}

      {/* Recent signals */}
      {data.signals.length > 0 && <RecentSignals signals={data.signals} />}
    </div>
  );
}

function StatsCards({ cred, prof, scores }: { cred: Credibility | null; prof: Profile | null; scores: Score[] }) {
  const winRate = cred ? Math.round(cred.win_rate * 100) : null;
  const avgScore = scores.length > 0
    ? (scores.reduce((s, sc) => s + sc.weighted_score, 0) / scores.length).toFixed(2)
    : null;
  const consistency = scores.length > 0
    ? Math.round((scores.filter((s) => s.consistency_bonus).length / scores.length) * 100)
    : null;

  const items = [
    { label: "Credibility", value: cred ? `${cred.score}` : "—", cls: cred && cred.score >= 60 ? "text-[#26A69A]" : cred && cred.score < 40 ? "text-[#EF5350]" : "text-white" },
    { label: "Win Rate", value: winRate !== null ? `${winRate}%` : "—", cls: winRate !== null && winRate >= 55 ? "text-[#26A69A]" : winRate !== null && winRate < 45 ? "text-[#EF5350]" : "text-white" },
    { label: "Trades", value: cred ? `${cred.total_trades}` : prof ? `${prof.total_signals}` : "—", cls: "text-white" },
    { label: "Avg Score", value: avgScore ?? "—", cls: avgScore && parseFloat(avgScore) > 0 ? "text-[#26A69A]" : avgScore && parseFloat(avgScore) < 0 ? "text-[#EF5350]" : "text-white" },
    { label: "Consistency", value: consistency !== null ? `${consistency}%` : "—", cls: "text-white" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((s) => (
        <div key={s.label} className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] text-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="p-3">
            <p className={`font-mono text-[20px] font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetBreakdownSection({ breakdown }: { breakdown: AssetBreakdown }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Asset Breakdown
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(breakdown).map(([asset, d]) => {
            const bullPct = d.total > 0 ? Math.round((d.bullish / d.total) * 100) : 50;
            return (
              <div key={asset} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[13px] font-medium text-white/70">{asset}</span>
                  <span className="font-mono text-[11px] text-white/30">{d.total} signaler</span>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                  <div className="bg-[#26A69A]/60" style={{ width: `${bullPct}%` }} />
                  <div className="bg-[#EF5350]/60" style={{ width: `${100 - bullPct}%` }} />
                </div>
                <div className="flex justify-between font-mono text-[9px] text-white/20">
                  <span>{d.entries} entries</span>
                  <span>{d.exits} exits</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScoredSignals({ scores }: { scores: Score[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Senaste scorade signaler
        </h4>
        <div className="space-y-1.5">
          {scores.slice(0, 15).map((sc) => {
            const isWin = sc.weighted_score > 0;
            return (
              <div key={sc.signal_id} className="flex items-center gap-2 py-1">
                <span className={`font-mono text-[11px] font-bold tabular-nums ${isWin ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
                  {isWin ? "+" : ""}{sc.weighted_score.toFixed(2)}%
                </span>
                <span className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[sc.signal_type] ?? TYPE_TAG.opinion}`}>
                  {sc.signal_type}{sc.position ? ` ${sc.position}` : ""}
                </span>
                <span className="font-sans text-[11px] text-white/50">{sc.asset}</span>
                {sc.consistency_bonus && (
                  <span className="rounded bg-[#FF9800]/15 px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase text-[#FF9800]">
                    1.2x
                  </span>
                )}
                <div className="ml-auto flex gap-2 font-mono text-[9px] text-white/20">
                  {sc.score_30m !== null && <span>30m: {sc.score_30m.toFixed(2)}%</span>}
                  {sc.score_1h !== null && <span>1h: {sc.score_1h.toFixed(2)}%</span>}
                  {sc.score_2h !== null && <span>2h: {sc.score_2h.toFixed(2)}%</span>}
                  {sc.score_4h !== null && <span>4h: {sc.score_4h.toFixed(2)}%</span>}
                </div>
                <span className="font-mono text-[9px] text-white/15">{fmtAgo(sc.scored_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecentSignals({ signals }: { signals: Signal[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-4">
        <h4 className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Senaste signaler
        </h4>
        <div className="space-y-1.5">
          {signals.slice(0, 20).map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-0.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.direction === "bullish" ? "bg-[#26A69A]" : s.direction === "bearish" ? "bg-[#EF5350]" : "bg-[#FF9800]"}`} />
              <span className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase ${TYPE_TAG[s.signal_type] ?? TYPE_TAG.opinion}`}>
                {s.signal_type}{s.position ? ` ${s.position}` : ""}
              </span>
              <span className="font-sans text-[11px] text-white/50">{s.asset}</span>
              <span className={`font-sans text-[10px] font-bold ${DIR_CLR[s.direction]}`}>
                {s.direction.toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-white/20">{s.strength}</span>
              <span className="ml-auto font-mono text-[9px] text-white/15">{fmtAgo(s.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
