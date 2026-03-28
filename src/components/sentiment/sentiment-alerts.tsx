"use client";

import type { SentimentAlert } from "@/lib/sentiment-alerts";

const ALERT_STYLES: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  bias_flip: {
    icon: "⚡",
    bg: "bg-tv-yellow/10",
    border: "border-tv-yellow/30",
    text: "text-tv-yellow",
  },
  surge: {
    icon: "🔥",
    bg: "bg-tv-bull/10",
    border: "border-tv-bull/30",
    text: "text-tv-bull",
  },
  fade: {
    icon: "📉",
    bg: "bg-tv-bear/10",
    border: "border-tv-bear/30",
    text: "text-tv-bear",
  },
};

export function SentimentAlerts({ alerts }: { alerts: SentimentAlert[] }) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const style = ALERT_STYLES[alert.type] ?? ALERT_STYLES.surge;
        return (
          <div
            key={`${alert.asset}-${alert.type}-${i}`}
            className={`flex items-center gap-3 rounded-[6px] border ${style.border} ${style.bg} px-4 py-2.5 animate-fade-in`}
          >
            <span className="text-lg">{style.icon}</span>
            <div className="flex-1">
              <span className={`font-mono text-sm font-bold ${style.text}`}>
                {alert.message}
              </span>
            </div>
            <span className="font-mono text-[10px] text-tv-muted">
              {alert.type === "bias_flip" ? "BIAS FLIP" : alert.type === "surge" ? "SURGE" : "FADING"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
