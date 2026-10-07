/**
 * Fixed-window limiter kept in process memory. It slows casual abuse on a single instance;
 * a shared store (Redis or Firestore) is needed before relying on it across serverless instances.
 */
export function makeRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const now = opts.now ?? Date.now;

  return function allow(key: string): boolean {
    const t = now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + opts.windowMs });
      return true;
    }
    if (entry.count >= opts.limit) return false;
    entry.count += 1;
    return true;
  };
}
