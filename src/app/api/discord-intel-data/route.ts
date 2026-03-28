import { NextRequest, NextResponse } from "next/server";
import { getFilteredFeed } from "@/lib/queries";
import { getMessageStats } from "@/lib/queries-stats";
import { getDailyBriefing } from "@/lib/queries-briefing";

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const channel = sp.get("channel") ?? undefined;
  const asset = sp.get("asset") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const author = sp.get("author") ?? undefined;
  const signalType = sp.get("signalType") ?? undefined;
  const dateFrom = sp.get("dateFrom") ?? undefined;
  const dateTo = sp.get("dateTo") ?? undefined;

  const hasFilters = !!(q || author || (channel && channel !== "all") || (asset && asset !== "all") || (signalType && signalType !== "all") || dateFrom || dateTo);

  const [messages, stats, briefing] = await Promise.all([
    getFilteredFeed({ channel, asset, query: q, author, signalType, dateFrom, dateTo, limit: hasFilters ? 100 : 50 }).catch(() => []),
    getMessageStats().catch(() => ({ total: 0, processed: 0, signals: 0 })),
    getDailyBriefing().catch(() => null),
  ]);

  return NextResponse.json({ messages, stats, briefing });
}
