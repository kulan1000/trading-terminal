"use client";

import { fmtAgoShort, fmtCost } from "@/lib/format-utils";
import { BarChart } from "./primitives";

interface PipelineData {
  unprocessed: number;
  recentSignals: number;
  recentMessages: number;
  latestSignal: string | null;
  latestMessage: string | null;
  filterRatio: number;
  cascade: {
    messagesIn: number;
    preFilterPassed: number;
    classified: number;
    signalsExtracted: number;
  };
  todayOpenAICalls: number;
  todayCostUsd: number;
  todayFilterCostUsd: number;
  todayClassifierCostUsd: number;
  signalHistory: Array<{ asset: string; direction: string; created_at: string }>;
  recentClassifications: Array<{
    asset: string | null;
    direction: string | null;
    signal_type: string | null;
    confidence: number | null;
    author: string | null;
    interpretation: string | null;
    created_at: string;
  }>;
}

type TileId = "queue" | "signals" | "messages" | "latest" | "filter" | "cost";

interface Tile {
  id: TileId;
  label: string;
  value: string | number;
  sub: string;
  status: "ok" | "warn" | "error";
}

function buildTiles(d: PipelineData): Tile[] {
  const signalAge = d.latestSignal ? Date.now() - new Date(d.latestSignal).getTime() : Infinity;
  return [
    {
      id: "queue",
      label: "Queue",
      value: d.unprocessed,
      sub: "unprocessed",
      status: d.unprocessed > 20 ? "warn" : "ok",
    },
    {
      id: "signals",
      label: "Signals / 1h",
      value: d.recentSignals,
      sub: "extracted",
      status: "ok",
    },
    {
      id: "messages",
      label: "Messages / 1h",
      value: d.recentMessages,
      sub: "ingested",
      status: "ok",
    },
    {
      id: "latest",
      label: "Latest signal",
      value: d.latestSignal ? fmtAgoShort(d.latestSignal) : "—",
      sub: "ago",
      status:
        signalAge < 2 * 60 * 60_000 ? "ok" : signalAge < 6 * 60 * 60_000 ? "warn" : "error",
    },
    {
      id: "filter",
      label: "Classifier",
      value: "gpt-5.6-sol",
      sub: "local worker · subscription",
      status: "ok",
    },
    {
      // Classification is subscription-billed on the worker, so any dollar
      // here means the serverless API fallback ran — that's the alert.
      id: "cost",
      label: "API cost today",
      value: fmtCost(d.todayCostUsd),
      sub: d.todayCostUsd > 0 ? `${d.todayOpenAICalls} fallback calls` : "fallback idle",
      status: d.todayCostUsd > 0 ? "warn" : "ok",
    },
  ];
}

export function HealthStrip({
  data,
  openId,
  onSelect,
}: {
  data: PipelineData;
  openId: TileId | null;
  onSelect: (id: TileId | null) => void;
}) {
  const tiles = buildTiles(data);
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => {
        const open = openId === t.id;
        const dot =
          t.status === "ok"
            ? "var(--color-tv-bull)"
            : t.status === "warn"
            ? "var(--color-tv-orange)"
            : "var(--color-tv-bear)";
        return (
          <button
            key={t.id}
            type="button"
            className="card-btn px-3 py-2.5"
            data-open={open || undefined}
            onClick={() => onSelect(open ? null : t.id)}
          >
            <div className="flex items-center justify-between">
              <span className="lbl">{t.label}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
              />
            </div>
            <div className="tick mt-1 text-[18px] font-semibold text-white">{t.value}</div>
            <div className="mt-0.5 text-[10px] text-white/30">{t.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

export function HealthDrilldown({
  data,
  openId,
  onClose,
}: {
  data: PipelineData;
  openId: TileId | null;
  onClose: () => void;
}) {
  if (!openId) return null;
  const tile = buildTiles(data).find((t) => t.id === openId);

  let body: React.ReactNode = null;

  if (openId === "queue") {
    body = (
      <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "var(--color-tv-border)" }}>
        <Stat label="Unprocessed" value={data.unprocessed} />
        <Stat label="Ingested / 1h" value={data.recentMessages} />
        <Stat label="Classified / 1h" value={data.recentSignals} />
        <Stat label="Drain order" value="newest first" sub="live stays current" />
      </div>
    );
  } else if (openId === "cost") {
    body = (
      <div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "var(--color-tv-border)" }}>
          <Stat label="Primary" value="$0.00" sub="subscription-billed" />
          <Stat
            label="API fallback"
            value={fmtCost(data.todayCostUsd)}
            sub={`${data.todayOpenAICalls} calls today`}
          />
          <Stat
            label="Est. monthly"
            value={fmtCost(data.todayCostUsd * 30)}
            sub="at today's fallback rate"
          />
          <Stat label="Fallback trigger" value="CLASSIFY_IN_PIPELINE=1" sub="never set on Vercel" />
        </div>
        <div className="px-4 pb-3 pt-2 text-[11px] text-white/40">
          Classification runs on the local worker via the ChatGPT subscription — zero marginal
          cost. Any dollar above means the serverless API fallback was switched on.
        </div>
      </div>
    );
  } else if (openId === "filter") {
    body = (
      <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "var(--color-tv-border)" }}>
        <Stat label="Model" value="gpt-5.6-sol" sub="reasoning effort low" />
        <Stat label="Transport" value="subscription" sub="Codex backend · SSE" />
        <Stat label="Runs on" value="local worker" sub="LaunchAgent · KeepAlive" />
        <Stat label="Serverless classify" value="off" sub="ingest/scoring only" />
      </div>
    );
  } else if (openId === "signals" || openId === "messages") {
    const bucketed = last8DaysFromHistory(
      data.signalHistory,
      openId === "signals" ? "all" : null,
    );
    body = (
      <div className="px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="lbl">last 8 days</span>
          <span className="tick text-[11px] text-white">
            {bucketed[bucketed.length - 1]?.count ?? 0} today
          </span>
        </div>
        <BarChart
          data={bucketed.map((b) => b.count)}
          color="#2962FF"
          height={70}
          highlightIdx={bucketed.length - 1}
        />
        <div className="mt-2 flex justify-between text-[10px] text-white/30">
          {bucketed.map((b) => (
            <span key={b.label}>{b.label}</span>
          ))}
        </div>
      </div>
    );
  } else if (openId === "latest") {
    const latest = data.recentClassifications[0];
    const dirColor =
      latest?.direction === "bullish"
        ? "var(--color-tv-bull)"
        : latest?.direction === "bearish"
        ? "var(--color-tv-bear)"
        : "var(--color-tv-orange)";
    body = latest ? (
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            className="chip"
            style={{ background: "rgba(255,255,255,0.05)", color: dirColor }}
          >
            {latest.direction?.toUpperCase() ?? "—"}
          </span>
          <div className="flex-1">
            <div className="text-[12px] text-white">
              {latest.asset ?? "?"} · {latest.signal_type ?? "—"} · conf{" "}
              {(latest.confidence ?? 0).toFixed(2)}
            </div>
            {latest.interpretation && (
              <div className="mt-1 text-[12px] text-white/50">"{latest.interpretation}"</div>
            )}
            <div className="tick mt-1.5 text-[10px] text-white/30">
              @{latest.author ?? "unknown"} · {fmtAgoShort(latest.created_at)} ago
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="px-4 py-6 text-center text-[12px] text-white/30">
        No classifications yet.
      </div>
    );
  }

  return (
    <div className="animate-expand overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-tv-border)", background: "var(--color-tv-surface)" }}>
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-tv-border)" }}
      >
        <span className="lbl">{tile?.label ?? ""}</span>
        <button className="lbl hover:text-white" onClick={onClose}>
          close ✕
        </button>
      </div>
      {body}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="px-4 py-2.5">
      <div className="lbl">{label}</div>
      <div className="tick mt-1 text-[14px] text-white">{value}</div>
      {sub != null && <div className="tick mt-0.5 text-[10px] text-white/30">{sub}</div>}
    </div>
  );
}

/**
 * Bucket the last 8 days of signalHistory into day counts. If `asset` is passed
 * we'd filter further — null gives the "all" series used for Signals tile.
 */
function last8DaysFromHistory(
  history: Array<{ asset: string; direction: string; created_at: string }>,
  _asset: string | null,
): Array<{ label: string; count: number }> {
  const days: Array<{ label: string; count: number; date: string }> = [];
  const today = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ label, count: 0, date });
  }
  for (const s of history) {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const found = days.find((x) => x.date === key);
    if (found) found.count++;
  }
  return days.map((d) => ({ label: d.label, count: d.count }));
}
