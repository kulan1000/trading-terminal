"use client";

import { useEffect, useState } from "react";

interface ReviewStats {
  total: number;
  approved: number;
  corrected: number;
  rejected: number;
  pending: number;
  activeRules: number;
  recentCorrections: Array<{
    category: string;
    rule_text: string;
    created_at: string;
  }>;
}

export function ReviewStats() {
  const [stats, setStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    fetch("/api/review-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats || stats.total === 0) return null;

  const correctionRate = stats.total > 0
    ? Math.round(((stats.corrected + stats.rejected) / (stats.total - stats.pending)) * 100) || 0
    : 0;

  const accuracyRate = stats.total > 0
    ? Math.round((stats.approved / (stats.total - stats.pending)) * 100) || 0
    : 0;

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <h3 className="font-sans text-[13px] font-semibold text-white">
          GPT Förbättringsöversikt
        </h3>

        {/* Stat cards */}
        <div className="mt-3 grid grid-cols-5 gap-3">
          <StatCard label="Granskade" value={stats.total - stats.pending} color="#fff" />
          <StatCard label="Godkända" value={stats.approved} color="#26A69A" />
          <StatCard label="Korrigerade" value={stats.corrected} color="#FF9800" />
          <StatCard label="Avvisade" value={stats.rejected} color="#EF5350" />
          <StatCard label="Aktiva regler" value={stats.activeRules} color="#2962FF" />
        </div>

        {/* Accuracy bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between font-sans text-[11px] text-white/40">
            <span>GPT-precision (godkänd utan korrigering)</span>
            <span className="font-mono text-white/70">{accuracyRate}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="flex h-full">
              <div
                className="h-full bg-[#26A69A] transition-all"
                style={{ width: `${accuracyRate}%` }}
              />
              <div
                className="h-full bg-[#FF9800] transition-all"
                style={{ width: `${correctionRate}%` }}
              />
            </div>
          </div>
          <div className="mt-1 flex gap-3 font-sans text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#26A69A]" /> Korrekt
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FF9800]" /> Korrigerad/avvisad
            </span>
          </div>
        </div>

        {/* Recent learned rules */}
        {stats.recentCorrections.length > 0 && (
          <div className="mt-3 border-t border-white/[0.04] pt-3">
            <p className="font-mono text-[10px] uppercase text-white/30">
              Senaste inlärda regler ({stats.activeRules} totalt)
            </p>
            <div className="mt-2 space-y-1">
              {stats.recentCorrections.slice(0, 5).map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded bg-white/[0.02] px-2 py-1.5"
                >
                  <span className="mt-0.5 shrink-0 rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[9px] uppercase text-white/40">
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
    <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-center">
      <p className="font-mono text-[18px] font-bold" style={{ color }}>{value}</p>
      <p className="font-sans text-[10px] text-white/40">{label}</p>
    </div>
  );
}
