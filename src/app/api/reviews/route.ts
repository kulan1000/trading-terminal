import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 30;

// GET — fetch pending reviews (and optionally all)
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const status = req.nextUrl.searchParams.get("status") ?? "pending";

  const query = supabase
    .from("classification_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status !== "all") query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] });
}

// POST — submit feedback on a review
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reviewId, action, correctAsset, correctDirection, correctSignalType, feedbackNote, secret } = body;

  // Auth: accept either CLASSIFY_SECRET or internal origin (same-site fetch)
  if (secret !== process.env.CLASSIFY_SECRET) {
    const origin = req.headers.get("origin") ?? "";
    const host = req.headers.get("host") ?? "";
    if (!origin.includes(host) && !origin.includes("localhost")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!reviewId || !action) {
    return NextResponse.json({ error: "Missing reviewId or action" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Update the review record
  const updateData: Record<string, unknown> = {
    status: action, // 'approved', 'corrected', 'rejected'
    reviewed_at: new Date().toISOString(),
    feedback_note: feedbackNote ?? null,
  };

  if (action === "corrected") {
    updateData.correct_asset = correctAsset;
    updateData.correct_direction = correctDirection;
    updateData.correct_signal_type = correctSignalType;

    // Also update the actual signal with corrected values
    const { data: review } = await supabase
      .from("classification_reviews")
      .select("signal_id, gpt_asset, gpt_signal_type")
      .eq("id", reviewId)
      .single();

    if (review?.signal_id) {
      const sigUpdate: Record<string, unknown> = {};
      if (correctAsset) sigUpdate.asset = correctAsset;
      if (correctDirection) sigUpdate.direction = correctDirection;
      if (correctSignalType) sigUpdate.signal_type = correctSignalType;

      if (Object.keys(sigUpdate).length > 0) {
        await supabase.from("signals").update(sigUpdate).eq("id", review.signal_id);
      }
    }

    // Auto-generate a feedback rule from the correction
    if (correctAsset && correctAsset !== "skip") {
      const { data: rev } = await supabase
        .from("classification_reviews")
        .select("gpt_asset, original_message, author, channel")
        .eq("id", reviewId)
        .single();

      if (rev) {
        const ruleText = feedbackNote
          ? feedbackNote
          : `In #${rev.channel}, "${rev.original_message.slice(0, 60)}..." by ${rev.author} should be ${correctAsset} (not ${rev.gpt_asset}). ${correctDirection ? `Direction: ${correctDirection}.` : ""}`;

        await supabase.from("classification_feedback").insert({
          category: "asset_rule",
          rule_text: ruleText,
          source_review_id: reviewId,
        });
      }
    }
  }

  // If rejected, mark the signal as low-quality (drop confidence)
  if (action === "rejected") {
    const { data: review } = await supabase
      .from("classification_reviews")
      .select("signal_id")
      .eq("id", reviewId)
      .single();

    if (review?.signal_id) {
      await supabase.from("signals")
        .update({ confidence: 0.05, strength: "weak" })
        .eq("id", review.signal_id);
    }
  }

  const { error } = await supabase
    .from("classification_reviews")
    .update(updateData)
    .eq("id", reviewId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, action });
}
