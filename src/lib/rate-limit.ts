// Simple in-memory rate limiter for API routes.
// For production scale, replace with Vercel KV or Redis.

const hits = new Map<string, { count: number; resetAt: number }>();

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (val.resetAt <= now) hits.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a key has exceeded the rate limit.
 * @returns null if allowed, or { retryAfterSeconds } if blocked.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { retryAfterSeconds: number } | null {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { retryAfterSeconds };
  }

  return null;
}
