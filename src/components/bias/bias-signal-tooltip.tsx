"use client";

import { fmtTime } from "@/lib/format-utils";

interface Props {
  author: string;
  direction: string;
  content: string | null;
  interpretation: string | null;
  created_at: string;
  strength: string;
}

export function BiasSignalTooltip({ author, direction, content, interpretation, created_at, strength }: Props) {
  const isBull = direction === "bullish";
  const color = isBull ? "#26A69A" : "#EF5350";
  const label = isBull ? "BULLISH" : "BEARISH";
  const time = fmtTime(created_at);
  const date = new Date(created_at).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm",
  });

  return (
    <div style={{
      background: "rgba(10,10,14,0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: 8,
      padding: "8px 10px",
      minWidth: 160,
      maxWidth: 260,
      border: `1px solid ${color}50`,
      boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${color}20`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.5px", fontFamily: "sans-serif" }}>
          {label}
        </span>
        {strength === "strong" && (
          <span style={{ fontSize: 8, fontWeight: 700, color: "#2962FF", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>
            STARK
          </span>
        )}
      </div>
      <div style={{ fontSize: 9.5, color: "#d4d4d8", lineHeight: 1.7, fontFamily: "sans-serif" }}>
        {[
          { label: "Trader", value: author },
          { label: "Tid", value: `${date} ${time}` },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#71717a" }}>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
      {(interpretation || content) && (
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: `1px solid ${color}25`,
          fontSize: 9.5, color: "#a1a1aa", lineHeight: 1.5, fontFamily: "sans-serif",
          whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 80, overflowY: "auto",
        }}>
          {interpretation ?? content}
        </div>
      )}
    </div>
  );
}
