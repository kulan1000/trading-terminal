"use client";

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

const TYPE_LABEL: Record<string, string> = {
  entry: "ENTRY", exited: "EXIT", position: "HOLD", opinion: "OPINION", target: "TARGET",
};

function fmtAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "nu";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

export function RecentClassifications({ data }: { data: Classification[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h2 className="mb-3 font-sans text-[13px] font-medium text-white/70">
        Senaste klassificeringar
      </h2>
      {!data.length ? (
        <p className="font-sans text-[12px] text-white/25">Inga klassificeringar ännu</p>
      ) : (
        <div className="space-y-1.5">
          {data.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-white/[0.02] px-3 py-2">
              <span className="w-10 shrink-0 font-mono text-[10px] font-bold text-white/40">
                {c.asset.slice(0, 4).toUpperCase()}
              </span>
              <span className={`w-12 shrink-0 font-mono text-[10px] font-bold ${DIR_COLOR[c.direction] ?? "text-white/40"}`}>
                {c.direction.slice(0, 4).toUpperCase()}
              </span>
              <span className="w-10 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-center font-mono text-[9px] text-white/40">
                {TYPE_LABEL[c.signal_type] ?? c.signal_type}
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-[10px] text-white/30">
                {(c.confidence * 100).toFixed(0)}%
              </span>
              <span className="truncate font-sans text-[10px] text-white/25">
                @{c.author}
              </span>
              {c.interpretation && (
                <span className="ml-auto hidden truncate font-sans text-[9px] italic text-white/15 lg:block" style={{ maxWidth: "200px" }}>
                  {c.interpretation}
                </span>
              )}
              <span className="ml-auto shrink-0 font-mono text-[9px] text-white/15">
                {fmtAgo(c.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
