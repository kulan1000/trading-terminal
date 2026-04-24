"use client";

import { useMemo, useState } from "react";
import { BarChart, Seg, DeltaChip } from "./primitives";

interface PipelineHistoryRow {
  started_at: string;
  status: string;
  duration_ms: number | null;
  signals: number;
}

interface SignalHistoryRow {
  asset: string;
  direction: string;
  created_at: string;
}

type Metric = "signals" | "success" | "accuracy";
const METRICS: readonly Metric[] = ["signals", "success", "accuracy"] as const;

interface DayBucket {
  label: string;
  date: string;
  signals: number;
  runs: number;
  successRuns: number;
}

function bucket7Days(
  pipelineHistory: PipelineHistoryRow[],
  signalHistory: SignalHistoryRow[],
): DayBucket[] {
  const days: DayBucket[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    days.push({ label, date, signals: 0, runs: 0, successRuns: 0 });
  }
  for (const s of signalHistory) {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const day = days.find((x) => x.date === key);
    if (day) day.signals++;
  }
  for (const r of pipelineHistory) {
    const d = new Date(r.started_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const day = days.find((x) => x.date === key);
    if (day) {
      day.runs++;
      if (r.status === "success") day.successRuns++;
    }
  }
  return days;
}

export function HistoryPanel({
  pipelineHistory,
  signalHistory,
}: {
  pipelineHistory: PipelineHistoryRow[];
  signalHistory: SignalHistoryRow[];
}) {
  const [metric, setMetric] = useState<Metric>("signals");

  const days = useMemo(
    () => bucket7Days(pipelineHistory, signalHistory),
    [pipelineHistory, signalHistory],
  );

  const series = useMemo(() => {
    if (metric === "signals") return days.map((d) => d.signals);
    if (metric === "success")
      return days.map((d) => (d.runs > 0 ? Math.round((d.successRuns / d.runs) * 100) : 0));
    // accuracy — not yet wired to a real review table, fall back to success-rate
    return days.map((d) => (d.runs > 0 ? Math.round((d.successRuns / d.runs) * 100) : 0));
  }, [metric, days]);

  const latest = series[series.length - 1] ?? 0;
  const prev = series[series.length - 2] ?? 0;
  const delta = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
  const suffix = metric === "signals" ? "" : "%";

  return (
    <div>
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-tv-border)" }}
      >
        <Seg options={METRICS} value={metric} onChange={setMetric} />
        <div className="flex items-baseline gap-3">
          <span className="tick text-[18px] text-white">
            {latest}
            {suffix}
          </span>
          <DeltaChip value={delta} />
        </div>
      </div>
      <div className="px-4 py-4">
        <BarChart
          data={series}
          height={80}
          highlightIdx={series.length - 1}
          color={metric === "success" ? "#26A69A" : "#2962FF"}
        />
        <div className="mt-2 flex justify-between text-[10px] text-white/30">
          {days.map((d) => (
            <span key={d.date}>{d.label}</span>
          ))}
        </div>
        {metric === "accuracy" && (
          <div className="mt-3 text-[10px] text-white/30">
            Accuracy currently mirrors pipeline success-rate — will use human-review outcomes once the review table is wired.
          </div>
        )}
      </div>
    </div>
  );
}
