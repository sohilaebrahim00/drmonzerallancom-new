// Lightweight in-memory sliding-window rate limiter shared by Edge
// Functions that call Gemini (ai-chat, food-scan), proxy an upstream API
// (food-search) or send mail (contact-submit). Resets on cold start — a
// high-traffic deployment should pair this with platform-level abuse
// protection.

interface Bucket {
  windowMs: number;
  timestamps: number[];
}

const requestLog = new Map<string, Bucket>();

// Bounds the map so a caller rotating identifiers cannot grow it without
// limit for the lifetime of the isolate (the old implementation never
// removed a key at all).
const MAX_TRACKED_KEYS = 10_000;
const EVICT_EVERY_N_CALLS = 500;
let callsSinceEviction = 0;

function evict(now: number): void {
  // Drop every bucket whose most recent hit is already outside its own
  // window — those buckets can no longer affect any decision.
  for (const [logKey, bucket] of requestLog) {
    const newest = bucket.timestamps[bucket.timestamps.length - 1] ?? 0;
    if (now - newest >= bucket.windowMs) requestLog.delete(logKey);
  }
  // If everything is still live and we are over the cap anyway, drop the
  // least recently used entries. Losing a bucket only ever forgives a
  // caller; it never blocks a legitimate one.
  if (requestLog.size > MAX_TRACKED_KEYS) {
    const oldestFirst = [...requestLog.entries()].sort(
      (a, b) =>
        (a[1].timestamps[a[1].timestamps.length - 1] ?? 0) -
        (b[1].timestamps[b[1].timestamps.length - 1] ?? 0),
    );
    for (const [logKey] of oldestFirst.slice(0, requestLog.size - MAX_TRACKED_KEYS)) {
      requestLog.delete(logKey);
    }
  }
}

export function isRateLimited(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const logKey = `${key}:${windowMs}:${maxRequests}`;
  const previous = requestLog.get(logKey)?.timestamps ?? [];
  const timestamps = previous.filter((t) => now - t < windowMs);
  timestamps.push(now);
  requestLog.set(logKey, { windowMs, timestamps });

  callsSinceEviction += 1;
  if (callsSinceEviction >= EVICT_EVERY_N_CALLS || requestLog.size > MAX_TRACKED_KEYS) {
    callsSinceEviction = 0;
    evict(now);
  }

  return timestamps.length > maxRequests;
}

/**
 * The one part of `x-forwarded-for` a client cannot forge.
 *
 * Proxies APPEND to this header, so a client that sends
 * `X-Forwarded-For: 1.2.3.4` ends up with `1.2.3.4, <their real ip>` by the
 * time it reaches the function — the FIRST entry is attacker-controlled,
 * the LAST is written by the hop in front of us. Keying a rate limit on the
 * whole header (or on its first entry) means a fresh bucket per request and
 * therefore no rate limit at all.
 *
 * Deliberately NOT used: `cf-connecting-ip` / `x-real-ip`, which a direct
 * caller can set to anything.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const hops = forwarded
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.length > 0 ? hops[hops.length - 1] : "unknown";
}
