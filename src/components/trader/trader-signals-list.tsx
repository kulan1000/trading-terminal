import { fmtDateTime } from "@/lib/format-utils";

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

const TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-tv-bull/20 text-tv-bull" },
  exited: { label: "EXIT", cls: "bg-tv-bear/20 text-tv-bear" },
  position: { label: "HOLD", cls: "bg-tv-blue/20 text-tv-blue" },
  opinion: { label: "OPINION", cls: "bg-tv-secondary/20 text-tv-secondary" },
  target: { label: "TARGET", cls: "bg-tv-orange/20 text-tv-orange" },
};

function ScoreCell({ val }: { val: number | null }) {
  if (val == null) return <span className="text-tv-muted">—</span>;
  const cls = val > 0 ? "text-tv-bull" : val < 0 ? "text-tv-bear" : "text-tv-secondary";
  return <span className={cls}>{val > 0 ? "+" : ""}{val.toFixed(2)}</span>;
}

export function TraderSignalsList({ signals, scores }: { signals: Signal[]; scores: Score[] }) {
  const scoreMap = new Map(scores.map((s) => [s.signal_id, s]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-tv-border text-left text-[10px] uppercase tracking-wider text-tv-muted">
            <th className="px-2 py-2">Tid</th>
            <th className="px-2 py-2">Typ</th>
            <th className="px-2 py-2">Asset</th>
            <th className="px-2 py-2">Riktning</th>
            <th className="px-2 py-2">Conf</th>
            <th className="px-2 py-2">30m</th>
            <th className="px-2 py-2">1h</th>
            <th className="px-2 py-2">2h</th>
            <th className="px-2 py-2">4h</th>
            <th className="px-2 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((sig) => {
            const sc = scoreMap.get(sig.id);
            const time = fmtDateTime(sig.created_at);
            const typeInfo = TYPE_STYLE[sig.signal_type] ?? { label: sig.signal_type, cls: "bg-tv-input text-tv-secondary" };
            const dirCls = sig.direction === "bullish" ? "text-tv-bull" : sig.direction === "bearish" ? "text-tv-bear" : "text-tv-secondary";

            return (
              <tr key={sig.id} className="border-b border-tv-divider transition-colors hover:bg-tv-elevated/50">
                <td className="px-2 py-1.5 text-tv-muted">{time}</td>
                <td className="px-2 py-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${typeInfo.cls}`}>{typeInfo.label}</span>
                </td>
                <td className="px-2 py-1.5 text-tv-text">{sig.asset}</td>
                <td className={`px-2 py-1.5 ${dirCls}`}>
                  {sig.direction === "bullish" ? "↑ BULL" : sig.direction === "bearish" ? "↓ BEAR" : "— NEUT"}
                  {sig.position && <span className="ml-1 text-tv-muted">({sig.position})</span>}
                </td>
                <td className="px-2 py-1.5 text-tv-text">{sig.confidence.toFixed(1)}</td>
                <td className="px-2 py-1.5"><ScoreCell val={sc?.score_30m ?? null} /></td>
                <td className="px-2 py-1.5"><ScoreCell val={sc?.score_1h ?? null} /></td>
                <td className="px-2 py-1.5"><ScoreCell val={sc?.score_2h ?? null} /></td>
                <td className="px-2 py-1.5"><ScoreCell val={sc?.score_4h ?? null} /></td>
                <td className="px-2 py-1.5 font-bold">
                  {sc ? (
                    <span className={sc.weighted_score > 0 ? "text-tv-bull" : sc.weighted_score < 0 ? "text-tv-bear" : "text-tv-secondary"}>
                      {sc.weighted_score > 0 ? "+" : ""}{sc.weighted_score.toFixed(2)}
                      {sc.consistency_bonus && <span className="ml-1 text-tv-yellow" title="Consistency bonus">★</span>}
                    </span>
                  ) : (
                    <span className="text-tv-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
