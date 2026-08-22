// Shared CORS for every browser-facing Edge Function.
//
// Previously this exported a constant with `Access-Control-Allow-Origin: *`,
// which let any site on the internet call these functions from a visitor's
// browser — a free Gemini chatbot on the practice's key, and no origin check
// backing up the rate limits in ai-chat / food-search / contact-submit.
//
// Now the origin is echoed back ONLY when it is on the allowlist below. A
// request from anywhere else gets no Access-Control-Allow-Origin header at
// all, so the browser refuses to hand the response to the calling page.
//
// This is a browser-enforced control, not authentication: curl and other
// non-browser clients ignore CORS entirely. It closes the "any website can
// use our backend" hole; it does not replace the auth checks inside each
// function.

const ALLOWED_ORIGINS = new Set([
  "https://monzerallan.com",
  "https://www.monzerallan.com",
  "https://app.monzerallan.com",
  "https://demo.monzerallan.com",
  // Capacitor native shells. iOS serves the bundle from capacitor://localhost;
  // Android's default scheme (no `server.androidScheme` is set in
  // capacitor.config.ts) is https://localhost. Both must be here or the
  // installed app's fetches fail CORS in the WebView.
  "capacitor://localhost",
  "https://localhost",
  // Local development: `npm run dev` / `npm run dev:app` and `npm run preview`.
  "http://localhost:5173",
  "http://localhost:4173",
]);

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Responses differ per Origin, so caches must not serve one origin's
  // response to another.
  Vary: "Origin",
};

/**
 * Headers to spread onto every response of a browser-facing function,
 * including the OPTIONS preflight branch. Call it once per request:
 *   serve(async (req) => {
 *     const CORS_HEADERS = corsHeaders(req);
 *     ...
 *   });
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin };
  }
  return { ...BASE_HEADERS };
}
