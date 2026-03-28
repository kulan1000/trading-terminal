"use client";

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

interface Score {
  weighted_score: number;
  consistency_bonus: boolean;
}

export function TraderStatsCards({ cred, prof, scores }: { cred: Credibility | null; prof: Profile | null; scores: Score[] }) {
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
