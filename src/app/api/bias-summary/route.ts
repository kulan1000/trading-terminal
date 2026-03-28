import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { ASSETS } from "@/lib/constants";

export const revalidate = 300; // Cache for 5 minutes

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET() {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const summaries = await Promise.all(
    ASSETS.map(async (asset) => {
      const { data } = await supabase
        .from("signals")
        .select("signal_type, direction, position, confidence, author, interpretation")
        .eq("asset", asset)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(15);

      const signals = data ?? [];
      if (!signals.length) {
        return { asset, summary: "No recent activity." };
      }

      const entries = signals.filter((s) => s.signal_type === "entry").length;
      const exits = signals.filter((s) => s.signal_type === "exited").length;
      const bullish = signals.filter((s) => s.direction === "bullish").length;
      const bearish = signals.filter((s) => s.direction === "bearish").length;

      const prompt = `You are a trading terminal AI. Summarize the community sentiment for ${asset} in exactly 1-2 sentences. Be concise and terminal-style.

Recent signals (last 6h): ${signals.length} total, ${entries} entries, ${exits} exits, ${bullish} bullish, ${bearish} bearish.
Key interpretations: ${signals.slice(0, 5).map((s) => s.interpretation).filter(Boolean).join("; ")}

Write a brief, factual summary. No fluff. Example style: "Community predominantly bullish after break above key level. 3 new entries in last 2h, no exits."`;

      try {
        const resp = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 100,
        });
        const summary = resp.choices[0]?.message?.content?.trim() ?? "No summary available.";
        return { asset, summary };
      } catch {
        return { asset, summary: `${bullish} bullish vs ${bearish} bearish signals. ${entries} entries, ${exits} exits.` };
      }
    })
  );

  return NextResponse.json({ summaries });
}
