/**
 * PRODUCTION STUB for src/dev/demoFixtures.ts — swapped in ONLY for
 * `vite build` / `vite build --mode app` (see the conditional `resolve.alias`
 * in vite.config.ts, gated on `command === "build"`; the dev server always
 * resolves the real file).
 *
 * Belt-and-suspenders on top of the runtime guard in src/dev/demoMode.ts:
 * that guard already makes every `if (getDemoMode()) return DEMO_X` branch
 * across the codebase unreachable in production (import.meta.env.DEV is
 * false there), but the unreachable branch's *code* still ships in the
 * bundle — dead-code elimination across a function-call boundary isn't
 * something bundler minifiers reliably do. This stub makes sure that even
 * that unreachable code contains no actual fixture content (names, sample
 * health numbers, fake emails) — every export below is an empty/neutral
 * placeholder, never real-looking data. Verified empty by grepping
 * dist/dist-app for the real fixture strings after every build.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const DEMO_USER = null as any;
export const DEMO_SESSION = null as any;
export const DEMO_DOCTOR_USER = null as any;
export const DEMO_DOCTOR_SESSION = null as any;
export const DEMO_PROFILE = null as any;
export const DEMO_DOCTOR_PROFILE = null as any;
export const DEMO_MEALS_TODAY = [] as any;
export const DEMO_TARGET = null as any;
export const DEMO_BODY_PROFILE = null as any;
export const DEMO_STEP_LOG = null as any;
export const DEMO_HYDRATION_LOGS = [] as any;
export const DEMO_HYDRATION_GOAL = null as any;
export const DEMO_WEIGHT_HISTORY = [] as any;
export const DEMO_ACTIVITY_LIBRARY = [] as any;
export const DEMO_ACTIVITY_TASK = null as any;
export const DEMO_ACTIVITY_LOGS_TODAY = [] as any;
export const DEMO_PROGRAM = null as any;
export const DEMO_PROGRAM_DAY = null as any;
export const DEMO_CHECKIN_TODAY = null as any;
export const DEMO_CHECKINS_7D = [] as any;
export const DEMO_FRIENDS = [] as any;
export const DEMO_INCOMING_REQUESTS = [] as any;
export const DEMO_SENT_REQUESTS = [] as any;
export const DEMO_ACTIVITY_FEED = [] as any;
export const DEMO_FRIEND_PUBLIC_PROFILE = {} as any;
export const DEMO_CONVERSATIONS = [] as any;
export const DEMO_MESSAGES = [] as any;
export const DEMO_SUBSCRIPTION = null as any;
export const DEMO_CONSULTATION = null as any;
export const DEMO_PATIENTS = [] as any;
export const DEMO_NEEDS_REVIEW = [] as any;
export const DEMO_DOCTOR_CONSULTATIONS = [] as any;
export const DEMO_PATIENT_DETAIL = {} as any;
export const DEMO_PATIENT_OVERVIEWS = [] as any;
export const DEMO_DOCTOR_ACTIVITY_FEED = [] as any;
export const DEMO_ACTIVE_PROGRAMS_SUMMARY = { active: 0, draft: 0 } as any;
export const DEMO_SCAN_RESULT = null as any;
