// Simple in-memory rate limiter for serverless functions
// Limits are per-instance (Vercel spins up new instances as needed)
// Good enough to prevent accidental spam and runaway crons

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g. endpoint name or IP)
 * @param maxPerWindow - Max requests allowed per window
 * @param windowMs - Window duration in milliseconds
 * @returns null if allowed, or { retryAfterMs } if rate-limited
 */
export function checkRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number
): { retryAfterMs: number } | null {
  const now = Date.now();
  const existing = windows.get(key);

  // Window expired or doesn't exist — start fresh
  if (!existing || now >= existing.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  // Within window — check count
  if (existing.count >= maxPerWindow) {
    return { retryAfterMs: existing.resetAt - now };
  }

  existing.count++;
  return null;
}
