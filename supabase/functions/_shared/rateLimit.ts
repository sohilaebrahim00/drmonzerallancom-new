// Lightweight in-memory sliding-window rate limiter shared by Edge
// Functions that call Gemini (ai-chat, food-scan). Resets on cold start —
// fine for the initial implementation; a high-traffic deployment should
// pair this with platform-level abuse protection.

const requestLog = new Map<string, number[]>();

export function isRateLimited(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const logKey = `${key}:${windowMs}:${maxRequests}`;
  const timestamps = (requestLog.get(logKey) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  requestLog.set(logKey, timestamps);
  return timestamps.length > maxRequests;
}
