"use client";

import { useEffect, useState } from "react";

interface ReviewStatsData {
  total: number;
  approved: number;
  corrected: number;
  rejected: number;
  pending: number;
  activeRules: number;
  recentCorrections: Array<{ category: string; rule_text: string; created_at: string }>;
}

export function ReviewStats() {
  const [stats, setStats] = useState<ReviewStatsData | null>(null);

  useEffect(() => {
    fetch("/api/review-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch((err) => console.error("[ReviewStats]", err));
  }, []);

  if (!stats || stats.total === 0) return null;

  const reviewed = stats.total - stats.pending;
  const correctionRate = reviewed > 0 ? Math.round(((stats.corrected + stats.rejected) / reviewed) * 100) : 0;
  const accuracyRate = reviewed > 0 ? Math.round((stats.approved / reviewed) * 100) : 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 pt-4 pb-5">
        <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
          GPT Improvement Overview
        </h3>

        <div className="mt-3 grid grid-cols-5 gap-2.5">
          <StatCard label="Reviewed" value={reviewed} color="text-white" />
          <StatCard label="Approved" value={stats.approved} color="text-[#26A69A]" />
          <StatCard label="Corrected" value={stats.corrected} color="text-[#FF9800]" />
          <StatCard label="Rejected" value={stats.rejected} color="text-[#EF5350]" />
          <StatCard label="Active rules" value={stats.activeRules} color="text-[#FF9800]" />
        </div>

        {/* Accuracy bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between font-sans text-[11px] text-white/40">
            <span>GPT precision</span>
            <span className="font-mono tabular-nums text-white/70">{accuracyRate}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="flex h-full">
              <div className="h-full bg-[#26A69A] transition-all" style={{ width: `${accuracyRate}%` }} />
              <div className="h-full bg-[#FF9800] transition-all" style={{ width: `${correctionRate}%` }} />
            </div>
          </div>
          <div className="mt-1.5 flex gap-3 font-sans text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#26A69A]" /> Correct
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FF9800]" /> Corrected/rejected
            </span>
          </div>
        </div>

        {/* Recent learned rules */}
        {stats.recentCorrections.length > 0 && (
          <div className="mt-3 border-t border-white/[0.04] pt-3">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
              Latest learned rules ({stats.activeRules} total)
            </span>
            <div className="mt-2 space-y-1">
              {stats.recentCorrections.slice(0, 5).map((rule, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                  <span className="mt-0.5 shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-white/40">
                    {rule.category.replace("_rule", "").replace("_", " ")}
                  </span>
                  <p className="font-sans text-[11px] leading-snug text-white/50">
                    {rule.rule_text.slice(0, 120)}{rule.rule_text.length > 120 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-center">
      <p className={`font-mono text-[16px] font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">{label}</p>
    </div>
  );
}
