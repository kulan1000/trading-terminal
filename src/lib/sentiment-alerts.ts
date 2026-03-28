// Detect rapid sentiment shifts by comparing recent snapshots
// A "shift" = bias changed OR confidence jumped significantly within a short window

export interface SentimentAlert {
  asset: string;
  type: "bias_flip" | "surge" | "fade";
  from: string;
  to: string;
  confidenceDelta: number;
  minutesAgo: number;
  message: string;
}

interface SnapshotPoint {
  net_score: number;
  confidence: number;
  bias: string;
  created_at: string;
}

const SURGE_THRESHOLD = 3; // confidence jump of 3+ points = surge
const FADE_THRESHOLD = -3; // confidence drop of 3+ points = fade

/**
 * Analyze snapshot history to detect shifts.
 * Compares the latest snapshot against snapshots from ~20min ago.
 */
export function detectAlerts(
  history: Record<string, SnapshotPoint[]>
): SentimentAlert[] {
  const alerts: SentimentAlert[] = [];
  const now = Date.now();

  for (const [asset, points] of Object.entries(history)) {
    if (points.length < 2) continue;

    const latest = points[points.length - 1];
    // Find snapshot from ~20 min ago (closest to 20min back)
    const targetTime = now - 20 * 60_000;
    let comparison: SnapshotPoint | null = null;
    for (const p of points) {
      const t = new Date(p.created_at).getTime();
      if (t <= targetTime) comparison = p;
    }

    // Fallback: use the oldest point if we don't have 20min of data
    if (!comparison && points.length >= 2) {
      comparison = points[0];
    }
    if (!comparison || comparison === latest) continue;

    const confDelta = latest.confidence - comparison.confidence;
    const minsAgo = Math.round((now - new Date(comparison.created_at).getTime()) / 60_000);

    // Bias flip: bullish ↔ bearish (not neutral transitions)
    if (
      latest.bias !== comparison.bias &&
      latest.bias !== "neutral" &&
      comparison.bias !== "neutral"
    ) {
      alerts.push({
        asset,
        type: "bias_flip",
        from: comparison.bias,
        to: latest.bias,
        confidenceDelta: confDelta,
        minutesAgo: minsAgo,
        message: `${asset}: ${comparison.bias.toUpperCase()} → ${latest.bias.toUpperCase()} (${minsAgo}min)`,
      });
    }
    // Surge: neutral/weak → strong (big confidence jump)
    else if (confDelta >= SURGE_THRESHOLD) {
      alerts.push({
        asset,
        type: "surge",
        from: comparison.bias,
        to: latest.bias,
        confidenceDelta: confDelta,
        minutesAgo: minsAgo,
        message: `${asset}: ${latest.bias.toUpperCase()} surge +${confDelta.toFixed(1)} conf (${minsAgo}min)`,
      });
    }
    // Fade: strong → weak (big confidence drop)
    else if (confDelta <= FADE_THRESHOLD) {
      alerts.push({
        asset,
        type: "fade",
        from: comparison.bias,
        to: latest.bias,
        confidenceDelta: confDelta,
        minutesAgo: minsAgo,
        message: `${asset}: ${comparison.bias.toUpperCase()} fading ${confDelta.toFixed(1)} conf (${minsAgo}min)`,
      });
    }
  }

  return alerts.sort((a, b) => a.minutesAgo - b.minutesAgo);
}
