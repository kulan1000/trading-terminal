import { ASSET_TAG_COLORS, DIRECTION_COLOR } from "@/lib/constants";

interface Target {
  id: number;
  asset: string;
  direction: string;
  target_price: number;
  confidence: number;
  author: string;
  created_at: string;
}

export function TargetsPanel({ targets }: { targets: Target[] }) {
  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        Price Targets
      </h3>
      <div className="space-y-2">
        {targets.map((t) => {
          const dir = t.direction as keyof typeof DIRECTION_COLOR;
          const arrow = t.direction === "bullish" ? "▲" : t.direction === "bearish" ? "▼" : "—";
          return (
            <div key={t.id} className="flex items-center gap-2 font-mono text-xs">
              <span
                className={`w-14 shrink-0 rounded-[4px] px-1.5 py-0.5 text-center text-[10px] font-semibold uppercase ${ASSET_TAG_COLORS[t.asset] ?? "bg-tv-input text-tv-secondary"}`}
              >
                {t.asset}
              </span>
              <span className={`shrink-0 font-bold ${DIRECTION_COLOR[dir] ?? "text-tv-secondary"}`}>
                {arrow} {t.target_price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="shrink-0 text-tv-blue font-medium">{t.author}</span>
              <span className="ml-auto text-tv-muted">
                {new Date(t.created_at).toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Stockholm",
                })}
              </span>
            </div>
          );
        })}
        {!targets.length && (
          <p className="text-xs italic text-tv-secondary">No targets yet — will appear as traders post price levels</p>
        )}
      </div>
    </div>
  );
}
