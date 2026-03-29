import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Fetch all reviews (limited to recent 500)
  const { data: reviews } = await supabase
    .from("classification_reviews")
    .select("status")
    .limit(500);

  const counts = { total: 0, approved: 0, corrected: 0, rejected: 0, pending: 0 };
  for (const r of reviews ?? []) {
    counts.total++;
    const s = r.status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  // Count active feedback rules
  const { count: activeRules } = await supabase
    .from("classification_feedback")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  // Recent feedback rules (for the list)
  const { data: recentRules } = await supabase
    .from("classification_feedback")
    .select("category, rule_text, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    ...counts,
    activeRules: activeRules ?? 0,
    recentCorrections: recentRules ?? [],
  });
}
