import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { STRENGTH } from "@/lib/decay-utils";
import type { Asset } from "@/lib/types";

const ASSETS: Asset[] = ["Gold", "Silver", "Oil"];

interface TopTrader {
  author: string;
  count: number;
  direction: string;
  winRate: number | null;
}

interface DailySummaryRow {
  id: number;
  summary_date: string;
  asset: string;
  direction: string;
  bias_score: number;
  signal_count: number;
  top_traders: TopTrader[];
  summary_text: string | null;
  created_at: string;
}

/** Generate and save daily summaries for all assets */
export async function generateDailySummary(dateStr?: string) {
  const supabase = getSupabaseAdmin();
  const targetDate = dateStr ?? new Date().toISOString().slice(0, 10);
  const dayStart = `${targetDate}T00:00:00Z`;
  const dayEnd = `${targetDate}T23:59:59Z`;

  const results: DailySummaryRow[] = [];

  for (const asset of ASSETS) {
    // Get all signals for this asset today
    const { data: signals } = await supabase
      .from("signals")
      .select("direction, confidence, strength, signal_type, author, created_at")
      .eq("asset", asset)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    const rows = (signals ?? []) as Array<{
      direction: string; confidence: number; strength: string;
      signal_type: string | null; author: string; created_at: string;
    }>;

    if (!rows.length) continue;

    // Calculate bias
    let bullW = 0, bearW = 0;
    for (const s of rows) {
      const w = (STRENGTH[s.strength] ?? 2) * s.confidence;
      if (s.direction === "bullish") bullW += w;
      else if (s.direction === "bearish") bearW += w;
    }
    const total = bullW + bearW;
    const direction = bullW > bearW ? "bullish" : bearW > bullW ? "bearish" : "neutral";
    const biasScore = total > 0 ? Math.round((Math.max(bullW, bearW) / total) * 100) : 0;

    // Top traders by signal count
    const traderMap = new Map<string, { count: number; dirs: string[] }>();
    for (const s of rows) {
      if (s.direction === "neutral") continue;
      const t = traderMap.get(s.author) ?? { count: 0, dirs: [] };
      t.count++;
      t.dirs.push(s.direction);
      traderMap.set(s.author, t);
    }

    // Fetch credibility for top traders
    const traderNames = [...traderMap.keys()];
    const { data: credRows } = await supabase
      .from("user_credibility" as never)
      .select("discord_user, win_rate")
      .in("discord_user", traderNames);

    const credMap = new Map<string, number>();
    for (const r of (credRows ?? []) as Array<{ discord_user: string; win_rate: number }>) {
      credMap.set(r.discord_user, r.win_rate);
    }

    const topTraders: TopTrader[] = [...traderMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([author, info]) => ({
        author,
        count: info.count,
        direction: info.dirs.filter(d => d === "bullish").length >= info.dirs.filter(d => d === "bearish").length ? "bullish" : "bearish",
        winRate: credMap.get(author) ?? null,
      }));

    const directionalCount = rows.filter(s => s.direction !== "neutral").length;

    // Build summary text
    const summaryText = `${asset}: ${direction} ${biasScore}% (${directionalCount} signals). Top: ${topTraders.map(t => `${t.author} (${t.count})`).join(", ")}`;

    // Upsert into daily_summaries
    const { data: inserted } = await supabase
      .from("daily_summaries")
      .upsert({
        summary_date: targetDate,
        asset,
        direction,
        bias_score: biasScore,
        signal_count: directionalCount,
        top_traders: topTraders,
        summary_text: summaryText,
      }, { onConflict: "summary_date,asset" })
      .select()
      .single();

    if (inserted) results.push(inserted as DailySummaryRow);
  }

  return results;
}

/** Fetch daily summaries for a given date */
export async function getDailySummaries(dateStr?: string): Promise<DailySummaryRow[]> {
  const supabase = getSupabaseAdmin();
  const target = dateStr ?? new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("summary_date", target)
    .order("asset");

  return (data ?? []) as DailySummaryRow[];
}

