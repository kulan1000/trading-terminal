// Smoke test: ONE real classification through the exact production path
// (classifyMessage → gpt-5.5 → strict json_schema → sanitize).
// Run: npx tsx scripts/smoke-classify.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
function loadEnv(file: string) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(line)) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.production.local");
loadEnv(".env.local");

/* eslint-disable @typescript-eslint/no-require-imports */
const { classifyMessage } = require("../src/lib/classify");

async function main() {
  const cases: Array<[string, string, boolean]> = [
    ["just went long silver here at 54.20, target 56", "gold-commodities", true],
    ["got filled long ES 7163 willing to dca 7160", "traders-lounge", true],
    ["taking most of my USO profits, will rebuy the dip", "traders-lounge", true],
  ];
  for (const [msg, channel, open] of cases) {
    const t0 = Date.now();
    const res = await classifyMessage(msg, channel, [], open);
    console.log(`OK ${Date.now() - t0}ms | "${msg.slice(0, 45)}..." →`,
      res.length
        ? res.map((r: { asset: string; direction: string; signal_type: string; position: string | null; confidence: number; target_price: number | null }) =>
            `${r.asset} ${r.direction} ${r.signal_type}${r.position ? "/" + r.position : ""} c=${r.confidence}${r.target_price ? " tgt=" + r.target_price : ""}`
          ).join(" | ")
        : "(no signal)");
  }
  console.log("SMOKE PASS — strict schema accepted by API, sanitize OK");
}

main().catch((e) => {
  console.error("SMOKE FAIL:", e.status ?? "", e.message);
  process.exit(1);
});
