import { timingSafeEqual } from "crypto";

/**
 * Constant-time string compare. Length is checked first (timingSafeEqual throws
 * on a length mismatch), so callers never leak which secret matched via timing.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Constant-time check of a bare secret value (e.g. from a JSON body field)
 * against one or more server-side secrets. Trims both sides; empty/undefined
 * candidates are ignored — with no secret configured this always fails closed.
 */
export function verifySecretValue(
  value: string | undefined | null,
  secrets: Array<string | undefined | null>,
): boolean {
  const token = value?.trim();
  if (!token) return false;
  const candidates = secrets
    .map((s) => s?.trim())
    .filter((s): s is string => !!s);
  return candidates.some((s) => safeEqual(token, s));
}

/**
 * Verify a request's `Authorization: Bearer <secret>` header against one or more
 * server-side secrets, in constant time.
 *
 * Both the incoming token and the configured secrets are trimmed, so a trailing
 * newline in env storage (a common `vercel env pull` artifact) can't silently
 * break auth. Empty/undefined candidate secrets are ignored; if no non-empty
 * secret is configured this returns false and the caller decides whether to
 * allow an unauthenticated dev fallback.
 */
export function verifyBearerAuth(
  request: Request,
  secrets: Array<string | undefined | null>,
): boolean {
  const header = request.headers.get("authorization");
  if (!header) return false;
  return verifySecretValue(header.replace(/^Bearer\s+/i, ""), secrets);
}
