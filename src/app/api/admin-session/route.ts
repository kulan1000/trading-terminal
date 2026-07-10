import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { verifySecretValue } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Typed-key login for the /admin console. On a correct key we set an
// httpOnly cookie holding SHA-256(secret) — the middleware gate compares
// against the same digest, so the raw secret never reaches the browser
// (and is never bundled: this all runs server-side).

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = checkRateLimit(`admin-session:${ip}`, 5, 60_000);
  if (limited) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let key: unknown;
  try {
    ({ key } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const candidates = [process.env.ADMIN_SECRET, process.env.CLASSIFY_SECRET];
  if (typeof key !== "string" || !verifySecretValue(key, candidates)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  // Cookie value = digest of the specific secret that matched, so rotating
  // either env var invalidates only sessions minted from it.
  const matched = candidates
    .map((s) => s?.trim())
    .find((s): s is string => !!s && verifySecretValue(key as string, [s]))!;
  const digest = createHash("sha256").update(matched).digest("hex");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tt_admin", digest, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
  return res;
}
