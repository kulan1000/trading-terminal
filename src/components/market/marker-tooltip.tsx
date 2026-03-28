import type { PositionedMarker } from "./marker-utils";

interface Props {
  marker: PositionedMarker;
  /** "small" for sparkline overlay, "large" for chart modal */
  size?: "small" | "large";
  /** Whether the original Discord message is shown */
  expanded?: boolean;
}

/** Shared trade-signal tooltip used by both sparkline overlay and chart modal */
export function MarkerTooltip({ marker: p, size = "small", expanded = false }: Props) {
  const time = new Date(p.msg_timestamp).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
  const date = new Date(p.msg_timestamp).toLocaleDateString("sv-SE", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm",
  });

  const isLarge = size === "large";
  const dotSize = isLarge ? 10 : 8;
  const fontSize = isLarge ? 12 : 10;
  const detailSize = isLarge ? 11 : 9.5;
  const pad = isLarge ? "10px 14px" : "8px 10px";
  const minW = isLarge ? 160 : 140;
  const gap = isLarge ? 16 : 12;

  return (
    <div style={{
      background: "rgba(10,10,14,0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: isLarge ? 10 : 8,
      padding: pad,
      minWidth: minW,
      maxWidth: expanded ? 320 : undefined,
      border: `1px solid ${p.style.color}50`,
      boxShadow: `0 ${isLarge ? 12 : 8}px ${isLarge ? 32 : 24}px rgba(0,0,0,${isLarge ? 0.7 : 0.6}), 0 0 ${isLarge ? 16 : 12}px ${p.style.color}20`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: isLarge ? 6 : 5, marginBottom: isLarge ? 6 : 3 }}>
        <div style={{
          width: dotSize, height: dotSize, borderRadius: "50%",
          background: p.style.color, flexShrink: 0,
        }} />
        <span style={{
          fontSize, fontWeight: 700, color: p.style.color,
          letterSpacing: "0.5px",
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
        }}>
          {p.style.label}
        </span>
      </div>
      {/* Details */}
      <div style={{
        fontSize: detailSize, color: "#d4d4d8", lineHeight: 1.7,
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
      }}>
        {[
          { label: "Trader", value: p.author },
          { label: "Price", value: `$${p.price_at_signal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}` },
          { label: "Time", value: `${date} ${time}` },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap }}>
            <span style={{ color: "#71717a" }}>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Original Discord message */}
      {expanded && p.content && (
        <div style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${p.style.color}25`,
        }}>
          <div style={{
            fontSize: 9, color: "#71717a", marginBottom: 3,
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            letterSpacing: "0.5px",
          }}>
            ORIGINAL MESSAGE
          </div>
          <div style={{
            fontSize: isLarge ? 11 : 10,
            color: "#a1a1aa",
            lineHeight: 1.5,
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 120,
            overflowY: "auto",
          }}>
            {p.content}
          </div>
        </div>
      )}

      {/* Click hint */}
      {!expanded && p.content && (
        <div style={{
          marginTop: 4,
          fontSize: 8,
          color: "#52525b",
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          textAlign: "center",
        }}>
          click to see message
        </div>
      )}
    </div>
  );
}
