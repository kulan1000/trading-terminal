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

    // Auto-generate feedback rules from the correction
    const { data: rev } = await supabase
      .from("classification_reviews")
      .select("gpt_asset, gpt_direction, gpt_signal_type, original_message, author, channel")
      .eq("id", reviewId)
      .single();

    if (rev) {
      const msgSnippet = `"${rev.original_message.slice(0, 60)}..."`;
      const rules: Array<{ category: string; rule_text: string }> = [];

      // Asset correction rule
      if (correctAsset && correctAsset !== rev.gpt_asset) {
        rules.push({
          category: "asset_rule",
          rule_text: feedbackNote
            ? feedbackNote
            : `In #${rev.channel}, ${msgSnippet} by ${rev.author} should be ${correctAsset} (not ${rev.gpt_asset}).`,
        });
      }

      // Direction correction rule
      if (correctDirection && correctDirection !== rev.gpt_direction) {
        rules.push({
          category: "direction_rule",
          rule_text: `${msgSnippet} by ${rev.author} is ${correctDirection} (not ${rev.gpt_direction}). Context: #${rev.channel}.`,
        });
      }

      // Signal type correction rule
      if (correctSignalType && correctSignalType !== rev.gpt_signal_type) {
        rules.push({
          category: "signal_type_rule",
          rule_text: `${msgSnippet} by ${rev.author} is a ${correctSignalType} (not ${rev.gpt_signal_type}). Messages like this should be classified as ${correctSignalType}.`,
        });
      }

      // General feedback note (if provided and no specific corrections matched)
      if (feedbackNote && rules.length === 0) {
        rules.push({ category: "asset_rule", rule_text: feedbackNote });
      }

      for (const rule of rules) {
        await supabase.from("classification_feedback").insert({
          ...rule,
          source_review_id: reviewId,
        });
      }
    }
  }

  // If approved with a trader_pattern marker, create a trader pattern rule
  if (action === "approved" && feedbackNote?.startsWith("__trader_pattern__:")) {
    const parts = feedbackNote.split(":");
    const traderName = parts[1];
    const traderAsset = parts[2];
    if (traderName && traderAsset) {
      // Check if pattern already exists for this trader+asset
      const { data: existing } = await supabase
        .from("classification_feedback")
        .select("id")
        .eq("category", "trader_pattern")
        .ilike("rule_text", `%${traderName}%${traderAsset}%`)
        .eq("active", true)
        .limit(1);

      if (!existing?.length) {
        await supabase.from("classification_feedback").insert({
          category: "trader_pattern",
          rule_text: `Trader "${traderName}" primarily trades ${traderAsset}. When "${traderName}" posts ambiguous messages without mentioning a specific commodity, assume ${traderAsset}.`,
          source_review_id: reviewId,
        });
      }
    }
    // Clear the marker from the stored feedback note
    updateData.feedback_note = `Trader pattern: ${parts[1]} → ${parts[2]}`;
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
