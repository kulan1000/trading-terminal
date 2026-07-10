import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Page-level gate for /admin: the operational console must never be publicly
// reachable (RUNBOOK "before sharing" item 1). Auth = httpOnly session cookie
// carrying the SHA-256 of the admin secret — set by /api/admin-session after
// a typed-key login, so the raw secret never lives in the browser.
//
// Edge runtime: node:crypto is unavailable here, so hashing uses Web Crypto.
// Comparing hex digests is timing-safe in practice — an attacker would need
// a SHA-256 preimage to exploit a prefix-timing oracle.

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  // Fail closed: no configured secret means no admin access at all.
  const secrets = [process.env.ADMIN_SECRET, process.env.CLASSIFY_SECRET]
    .map((s) => s?.trim())
    .filter((s): s is string => !!s);

  const cookie = req.cookies.get("tt_admin")?.value;
  if (cookie && secrets.length) {
    for (const secret of secrets) {
      if ((await sha256Hex(secret)) === cookie) return NextResponse.next();
    }
  }

  const login = req.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: "/admin/:path*",
};
