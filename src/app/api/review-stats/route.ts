import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Exact per-status counts — head:true count queries instead of pulling
  // rows (the old limit(500) capped `total` and made the split arbitrary
  // once reviews outgrew it).
  const statuses = ["approved", "corrected", "rejected", "pending"] as const;
  const countRows = await Promise.all(
    statuses.map((s) =>
      supabase
        .from("classification_reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", s)
    )
  );
  const counts = { total: 0, approved: 0, corrected: 0, rejected: 0, pending: 0 };
  statuses.forEach((s, i) => {
    counts[s] = countRows[i].count ?? 0;
    counts.total += counts[s];
  });

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
