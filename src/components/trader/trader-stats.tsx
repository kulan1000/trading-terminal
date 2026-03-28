import type { TraderProfileData } from "@/hooks/use-trader-profile";
import { winRateColor } from "@/lib/utils";

const ASSET_COLORS: Record<string, string> = {
  Gold: "text-tv-yellow",
  Silver: "text-tv-text",
  Oil: "text-tv-orange",
};

export function TraderStats({ data }: { data: TraderProfileData }) {
  const { credibility, profile, assetBreakdown, signals, scores } = data;

  const winRate = credibility?.win_rate ?? 0;
  const scoredCount = scores.length;
  const totalSignals = signals.length;

  // Score color
  const scoreColor = winRateColor(winRate);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Win Rate */}
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-3">
        <div className="font-sans text-[10px] uppercase tracking-wider text-tv-muted">Win Rate</div>
        <div className={`font-mono text-2xl font-bold ${scoreColor}`}>
          {(winRate * 100).toFixed(0)}%
        </div>
        <div className="font-mono text-[10px] text-tv-secondary">
          {credibility?.winning_trades ?? 0}W / {(credibility?.total_trades ?? 0) - (credibility?.winning_trades ?? 0)}L
        </div>
      </div>

      {/* Credibility Score */}
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-3">
        <div className="font-sans text-[10px] uppercase tracking-wider text-tv-muted">Credibility</div>
        <div className="font-mono text-2xl font-bold text-tv-blue">
          {credibility?.score ?? 0}
        </div>
        <div className="font-mono text-[10px] text-tv-secondary">
          {scoredCount} scorade av {totalSignals}
        </div>
      </div>

      {/* Total PnL */}
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-3">
        <div className="font-sans text-[10px] uppercase tracking-wider text-tv-muted">Total Score</div>
        <div className={`font-mono text-2xl font-bold ${(credibility?.total_pnl ?? 0) >= 0 ? "text-tv-bull" : "text-tv-bear"}`}>
          {(credibility?.total_pnl ?? 0) >= 0 ? "+" : ""}{(credibility?.total_pnl ?? 0).toFixed(1)}
        </div>
        <div className="font-mono text-[10px] text-tv-secondary">
          Avg {scoredCount > 0 ? (scores.reduce((s, sc) => s + sc.weighted_score, 0) / scoredCount).toFixed(2) : "—"}
        </div>
      </div>

      {/* Primary Asset */}
      <div className="rounded-[6px] border border-tv-border bg-tv-surface p-3">
        <div className="font-sans text-[10px] uppercase tracking-wider text-tv-muted">Fokus</div>
        <div className={`font-mono text-2xl font-bold ${ASSET_COLORS[profile?.primary_asset ?? ""] ?? "text-tv-text"}`}>
          {profile?.primary_asset ?? "—"}
        </div>
        <div className="font-mono text-[10px] text-tv-secondary">
          {profile?.primary_direction ?? "—"} bias · {profile?.avg_confidence?.toFixed(1) ?? "—"} conf
        </div>
      </div>

      {/* Asset Breakdown */}
      {Object.entries(assetBreakdown).map(([asset, ab]) => (
        <div key={asset} className="rounded-[6px] border border-tv-border bg-tv-surface p-3">
          <div className={`font-sans text-[10px] uppercase tracking-wider ${ASSET_COLORS[asset] ?? "text-tv-muted"}`}>{asset}</div>
          <div className="mt-1 flex gap-3 font-mono text-xs">
            <span className="text-tv-bull">{ab.bullish}↑</span>
            <span className="text-tv-bear">{ab.bearish}↓</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-tv-secondary">
            {ab.entries}E · {ab.exits}X · {ab.total} tot
          </div>
        </div>
      ))}
    </div>
  );
}
