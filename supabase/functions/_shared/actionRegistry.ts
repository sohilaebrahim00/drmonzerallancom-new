// Central, single source of truth for every navigation action the AI
// Concierge can offer — shared by all three surfaces this codebase presents:
// the marketing website (web), the installable Web App/PWA (pwa), and the
// Capacitor native app (native). pwa and native render the exact same
// app-style route tree (src/app-native/AppExperience.tsx) — one shared
// screen set, not two — so their entries are always identical by
// construction (see APP_ENTRIES below); only `web` genuinely differs.
//
// Gemini never supplies a raw destination for these — it can only choose a
// `concept` from ACTION_CONCEPTS, and the concrete {label, route} pair is
// always resolved here, server-side, for the caller's actual platform. If a
// concept has no entry for the caller's platform, the action is dropped
// entirely (see sanitizeActions below) — never rendered as a broken link.

export type Platform = "web" | "pwa" | "native";

export const ACTION_CONCEPTS = [
  "BOOK_CONSULTATION",
  "VIEW_MEMBERSHIP",
  "VIEW_PRODUCTS",
  "OPEN_AI",
  "VIEW_VIDEOS",
  "VIEW_BLOG",
  "OPEN_ACCOUNT",
  "OPEN_FOOD_SCANNER",
  "OPEN_PRAYER_TIMES",
  "OPEN_QIBLA",
  "VIEW_FAQ",
  "SIGN_IN",
  "CREATE_ACCOUNT",
  "CONTACT_TEAM",
] as const;

export type ActionConcept = (typeof ACTION_CONCEPTS)[number];

interface ActionDestination {
  label: string;
  route: string;
}

interface ConceptConfig {
  /** Marketing website destination, if this concept exists there. */
  web?: ActionDestination;
  /** Shared by pwa + native — both render the identical AppExperience route tree (see module doc above). */
  app?: ActionDestination;
}

const ACTION_CONFIG: Record<ActionConcept, ConceptConfig> = {
  BOOK_CONSULTATION: {
    web: { label: "Request a Consultation", route: "/account/consultations" },
    app: { label: "Book Consultation", route: "/consultations/book" },
  },
  VIEW_MEMBERSHIP: {
    web: { label: "View Memberships", route: "/packages" },
    app: { label: "My Membership", route: "/consultations" },
  },
  VIEW_PRODUCTS: {
    web: { label: "Browse Products", route: "/products" },
    app: { label: "View Products", route: "/products" },
  },
  OPEN_AI: {
    // Web has no dedicated AI page (floating widget only) — not offered as a link there.
    app: { label: "Ask AI", route: "/ai" },
  },
  VIEW_VIDEOS: {
    web: { label: "Watch Videos", route: "/videos" },
    app: { label: "Watch & Learn", route: "/videos" },
  },
  VIEW_BLOG: {
    web: { label: "Read the Blog", route: "/blog" },
    app: { label: "Blog", route: "/blog" },
  },
  OPEN_ACCOUNT: {
    web: { label: "My Account", route: "/account" },
    app: { label: "Account", route: "/account" },
  },
  OPEN_FOOD_SCANNER: {
    // App-experience-only feature (pwa + native) — never offered on the marketing website.
    app: { label: "Scan Food", route: "/food-scanner" },
  },
  OPEN_PRAYER_TIMES: {
    app: { label: "Prayer Times", route: "/prayer-times" },
  },
  OPEN_QIBLA: {
    app: { label: "Qibla", route: "/qibla" },
  },
  VIEW_FAQ: {
    web: { label: "View FAQ", route: "/faq" },
    // No FAQ screen in the app experience.
  },
  SIGN_IN: {
    web: { label: "Sign In", route: "/login" },
    app: { label: "Sign In", route: "/login" },
  },
  CREATE_ACCOUNT: {
    web: { label: "Create Account", route: "/join" },
    app: { label: "Create Account", route: "/join" },
  },
  CONTACT_TEAM: {
    web: { label: "Contact Team", route: "/contact" },
    app: { label: "Help & Support", route: "/account/help" },
  },
};

type Registry = Record<ActionConcept, Partial<Record<Platform, ActionDestination>>>;

function buildRegistry(): Registry {
  const registry = {} as Registry;
  for (const concept of ACTION_CONCEPTS) {
    const cfg = ACTION_CONFIG[concept];
    const entry: Partial<Record<Platform, ActionDestination>> = {};
    if (cfg.web) entry.web = cfg.web;
    if (cfg.app) {
      entry.pwa = cfg.app;
      entry.native = cfg.app;
    }
    registry[concept] = entry;
  }
  return registry;
}

const ACTION_REGISTRY: Registry = buildRegistry();

/** Resolves a concept to its real {label, route} for the caller's platform, or null if unsupported there. */
export function resolveAction(concept: string, platform: Platform): ActionDestination | null {
  const entry = ACTION_REGISTRY[concept as ActionConcept];
  if (!entry) return null;
  return entry[platform] ?? null;
}

/** The concepts Gemini is allowed to choose from for this request — used to build the platform-scoped response schema enum. */
export function getActionConceptsForPlatform(platform: Platform): ActionConcept[] {
  return ACTION_CONCEPTS.filter((concept) => Boolean(ACTION_REGISTRY[concept][platform]));
}

export interface ChatAction {
  type: "internal-route";
  label: string;
  route: string;
}

/**
 * Validates and resolves the model's raw `actions` array into real, safe
 * {label, route} pairs. Each raw action must be one of:
 *   - { kind: "concept", concept: <ActionConcept> } — resolved via the
 *     registry above; label always comes from the registry, never the model.
 *   - { kind: "route", route: <string>, label: <string> } — for the small
 *     set of dynamic, per-item routes (a specific product/article) that are
 *     identical across all platforms and already present in `knownRoutes`;
 *     label is model-authored (e.g. "Read: 10 Signs of Vitamin D
 *     Deficiency") and only length-capped, never route-checked beyond the
 *     allowlist.
 * Anything else — an unknown concept, a route not in the allowlist, a
 * concept unsupported on the caller's platform — is silently dropped rather
 * than rendered as a broken action.
 */
export function sanitizeActions(raw: unknown, platform: Platform, knownRoutes: Set<string>): ChatAction[] {
  if (!Array.isArray(raw)) return [];

  const actions: ChatAction[] = [];
  for (const entry of raw) {
    if (actions.length >= 3) break;
    if (typeof entry !== "object" || entry === null) continue;
    const a = entry as Record<string, unknown>;

    if (a.kind === "concept" && typeof a.concept === "string") {
      const resolved = resolveAction(a.concept, platform);
      if (resolved) actions.push({ type: "internal-route", label: resolved.label, route: resolved.route });
      continue;
    }

    if (a.kind === "route" && typeof a.route === "string" && typeof a.label === "string") {
      if (knownRoutes.has(a.route)) {
        actions.push({ type: "internal-route", label: a.label.slice(0, 60), route: a.route });
      }
      continue;
    }
  }
  return actions;
}
