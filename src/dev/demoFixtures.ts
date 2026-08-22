/**
 * DEVELOPMENT-ONLY fixture data for the demo-user / demo-doctor preview
 * modes (see src/dev/demoMode.ts for the full safety explanation). Pure
 * data — no Supabase import, no network call, nothing here can write
 * anywhere. Every value here is invented, clearly-fictional, and reused
 * consistently (e.g. "Ahmed" and "Mona" appear both as the demo user's
 * friends and as the demo doctor's patients) so the preview reads as one
 * coherent, honest fixture world rather than disconnected mock rows.
 */

import type { User, Session } from "@supabase/supabase-js";
import type { FullProfile } from "@/services/profileService";
import type { MealLog } from "@/services/mealLogService";
import type { FoodItem, FoodScanResult } from "@/services/foodScanService";
import type { DailyTarget, BodyProfile } from "@/services/bodyProfileService";
import type { ActivityLibraryEntry, ActivityTask } from "@/services/activityService";
import type { NutritionProgram, ProgramDay } from "@/services/programService";
import type { HydrationLog, HydrationGoal } from "@/services/hydrationService";
import type { DailyCheckin } from "@/services/checkinService";
import type { FriendshipRow } from "@/services/friendsService";
import type { Conversation, Message } from "@/services/messagingService";
import type { PublicProfileSummary } from "@/services/profileService";
import type { FeedEvent } from "@/services/socialFeedService";
import type { WeightLog } from "@/services/weightService";
import type { StepLog } from "@/services/stepService";
import type { Subscription, ConsultationRequest } from "@/services/membershipService";
import type { PatientSummary, PatientNeedsReview } from "@/services/doctorService";
import {
  DEMO_USER_ID,
  DEMO_DOCTOR_ID,
  DEMO_FRIEND_AHMED_ID,
  DEMO_FRIEND_MONA_ID,
  DEMO_PROGRAM_ID,
  DEMO_CONVERSATION_ID,
} from "@/dev/demoMode";

const todayAt = (hours: number, minutes = 0): string => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

// ── Identity ───────────────────────────────────────────────────────────

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "sarah.demo@example.com",
  app_metadata: {},
  user_metadata: { full_name: "Sarah Ahmed" },
  created_at: new Date().toISOString(),
} as User;

export const DEMO_SESSION: Session = {
  access_token: "demo-preview-not-a-real-token",
  refresh_token: "demo-preview-not-a-real-token",
  expires_in: 3600,
  token_type: "bearer",
  user: DEMO_USER,
} as Session;

export const DEMO_DOCTOR_USER: User = {
  id: DEMO_DOCTOR_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "doctor.demo@example.com",
  app_metadata: {},
  user_metadata: { full_name: "Dr. Monzer Allan" },
  created_at: new Date().toISOString(),
} as User;

export const DEMO_DOCTOR_SESSION: Session = {
  access_token: "demo-preview-not-a-real-token",
  refresh_token: "demo-preview-not-a-real-token",
  expires_in: 3600,
  token_type: "bearer",
  user: DEMO_DOCTOR_USER,
} as Session;

export const DEMO_PROFILE: FullProfile = {
  id: DEMO_USER_ID,
  full_name: "Sarah Ahmed",
  username: "sarah.fit",
  avatar_url: null,
  bio: "Demo preview account",
  role: "user",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  onboarding_current_step: "ready",
  onboarding_completed_at: new Date().toISOString(),
};

export const DEMO_DOCTOR_PROFILE: FullProfile = {
  id: DEMO_DOCTOR_ID,
  full_name: "Dr. Monzer Allan",
  username: "dr.monzerallan",
  avatar_url: null,
  bio: "Demo preview account",
  role: "doctor",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  onboarding_current_step: "ready",
  onboarding_completed_at: new Date().toISOString(),
};

// ── Nutrition / meals ──────────────────────────────────────────────────

function foodItem(
  name: string,
  portion: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): FoodItem {
  return {
    name,
    estimatedPortion: portion,
    estimatedCalories: calories,
    proteinGrams: protein,
    carbohydrateGrams: carbs,
    fatGrams: fat,
  };
}

// Reconciles exactly with "Today's Nutrition: 1,540 / 2,100 kcal" — the
// early micro-meal isn't one of the three the brief calls out by name, but
// keeps the total honest rather than special-casing the displayed sum.
export const DEMO_MEALS_TODAY: MealLog[] = [
  {
    id: "demo-meal-early",
    meal_time: todayAt(6, 30),
    meal_type: "snack",
    total_calories: 320,
    total_protein_g: 12,
    total_carbs_g: 40,
    total_fat_g: 12,
    is_outside_program: true,
    shared_with_friends: false,
    items: [foodItem("Coffee with Milk & Banana", "1 cup + 1 banana", 320, 12, 40, 12)],
  },
  {
    id: "demo-meal-breakfast",
    meal_time: todayAt(8, 0),
    meal_type: "breakfast",
    total_calories: 420,
    total_protein_g: 22,
    total_carbs_g: 55,
    total_fat_g: 12,
    is_outside_program: false,
    shared_with_friends: true,
    items: [foodItem("Oatmeal with Berries", "1 bowl", 420, 22, 55, 12)],
  },
  {
    id: "demo-meal-snack",
    meal_time: todayAt(10, 30),
    meal_type: "snack",
    total_calories: 190,
    total_protein_g: 15,
    total_carbs_g: 18,
    total_fat_g: 6,
    is_outside_program: false,
    shared_with_friends: true,
    items: [foodItem("Greek Yogurt", "1 cup", 190, 15, 18, 6)],
  },
  {
    id: "demo-meal-lunch",
    meal_time: todayAt(13, 15),
    meal_type: "lunch",
    total_calories: 610,
    total_protein_g: 33,
    total_carbs_g: 52,
    total_fat_g: 18,
    is_outside_program: true,
    shared_with_friends: true,
    items: [foodItem("Chicken Shawarma Wrap", "1 wrap", 610, 33, 52, 18)],
  },
];

export const DEMO_TARGET: DailyTarget = {
  daily_target: 2100,
  bmr_estimate: 1480,
  maintenance_estimate: 2260,
  protein_target_g: 120,
  carbs_target_g: 220,
  fat_target_g: 70,
  source: "auto",
  calculated_at: new Date().toISOString(),
};

export const DEMO_BODY_PROFILE: BodyProfile = {
  date_of_birth: "1994-04-12",
  height_cm: 165,
  weight_kg: 68,
  biological_sex: "female",
  activity_level: "moderate",
  goal: "lose_weight",
  preferred_weight_unit: "kg",
  preferred_height_unit: "cm",
  health_conditions: [],
  health_conditions_other: null,
  food_allergies: ["peanut"],
  food_allergies_other: null,
  food_intolerances: [],
  food_intolerances_other: null,
  dietary_preferences: [],
  medications: null,
};

// ── Steps / water / weight ─────────────────────────────────────────────

export const DEMO_STEP_LOG: StepLog = {
  date: new Date().toISOString().slice(0, 10),
  steps: 7420,
  source: "manual",
};

export const DEMO_HYDRATION_LOGS: HydrationLog[] = [
  { id: "demo-water-1", amount_ml: 500, logged_at: todayAt(8, 15) },
  { id: "demo-water-2", amount_ml: 500, logged_at: todayAt(11, 0) },
  { id: "demo-water-3", amount_ml: 500, logged_at: todayAt(13, 30) },
  { id: "demo-water-4", amount_ml: 300, logged_at: todayAt(15, 0) },
];
export const DEMO_HYDRATION_GOAL: HydrationGoal = { goal_ml: 2500, source: "user" };

export const DEMO_WEIGHT_HISTORY: WeightLog[] = [
  { id: "demo-weight-1", weight_kg: 68, logged_at: todayAt(7, 0) },
  {
    id: "demo-weight-2",
    weight_kg: 68.4,
    logged_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
  },
  {
    id: "demo-weight-3",
    weight_kg: 69.1,
    logged_at: new Date(Date.now() - 13 * 86_400_000).toISOString(),
  },
];

// ── Movement / activity ────────────────────────────────────────────────

export const DEMO_ACTIVITY_LIBRARY: ActivityLibraryEntry[] = [
  {
    id: "demo-activity-walk-20",
    name: "20-Minute Walk",
    category: "walking",
    duration_minutes: 20,
    difficulty: "easy",
    instructions: "A steady-pace walk for about 20 minutes.",
    met_value: 3.3,
  },
];

// available_at 12 minutes from now — matches "Ready in 12 minutes" exactly at the moment the screen loads.
export const DEMO_ACTIVITY_TASK: ActivityTask = {
  id: "demo-task-1",
  meal_log_id: "demo-meal-lunch",
  activity_id: "demo-activity-walk-20",
  available_at: new Date(Date.now() + 12 * 60_000).toISOString(),
  status: "pending",
  activity: DEMO_ACTIVITY_LIBRARY[0],
};

// A completed earlier activity — the "~210 kcal Estimated Activity" figure for today.
export const DEMO_ACTIVITY_LOGS_TODAY = [
  {
    id: "demo-activity-log-1",
    activity_task_id: null as string | null,
    activity_id: "demo-activity-walk-20",
    completed_at: todayAt(9, 0),
    duration_minutes: 20,
    estimated_calories_burned: 210,
    source: "task" as const,
  },
];

// ── 30-day program ─────────────────────────────────────────────────────

const programStart = new Date();
programStart.setDate(programStart.getDate() - 7); // today = day 8

export const DEMO_PROGRAM: NutritionProgram = {
  id: DEMO_PROGRAM_ID,
  patient_id: DEMO_USER_ID,
  doctor_id: DEMO_DOCTOR_ID,
  title: "30-Day Nutrition Program",
  start_date: programStart.toISOString().slice(0, 10),
  end_date: new Date(programStart.getTime() + 29 * 86_400_000).toISOString().slice(0, 10),
  goal: "lose_weight",
  daily_calorie_target: 2100,
  general_instructions: "Focus on protein at every meal and a 20-30 minute walk after lunch.",
  status: "active",
  is_template: false,
};

export const DEMO_PROGRAM_DAY: ProgramDay = {
  id: "demo-program-day-8",
  day_number: 8,
  water_goal_ml: 2500,
  movement_suggestion: "20-minute walk after lunch",
  doctor_instructions: "Great progress this week — keep protein consistent at breakfast.",
  items: [
    {
      id: "demo-item-breakfast",
      meal_type: "breakfast",
      title: "Oatmeal with Berries",
      description: null,
      suggested_foods: "Oats, mixed berries, a spoon of honey",
      portion_guidance: "1 bowl",
      approximate_calories: 420,
      time_suggestion: "08:00",
      sort_order: 0,
      completion: "completed",
    },
    {
      id: "demo-item-snack1",
      meal_type: "snack",
      title: "Greek Yogurt",
      description: null,
      suggested_foods: "Plain Greek yogurt, a few almonds",
      portion_guidance: "1 cup",
      approximate_calories: 190,
      time_suggestion: "10:30",
      sort_order: 1,
      completion: "completed",
    },
    {
      id: "demo-item-lunch",
      meal_type: "lunch",
      title: "Chicken + Rice + Vegetables",
      description: null,
      suggested_foods: "Grilled chicken breast, brown rice, roasted vegetables",
      portion_guidance: "1 plate",
      approximate_calories: 560,
      time_suggestion: "13:30",
      sort_order: 2,
      completion: null,
    },
    {
      id: "demo-item-snack2",
      meal_type: "snack",
      title: "Apple & Almonds",
      description: null,
      suggested_foods: "1 apple, a small handful of almonds",
      portion_guidance: "1 apple + 10 almonds",
      approximate_calories: 180,
      time_suggestion: "16:30",
      sort_order: 3,
      completion: "completed",
    },
    {
      id: "demo-item-dinner",
      meal_type: "dinner",
      title: "Grilled Salmon + Quinoa",
      description: null,
      suggested_foods: "Grilled salmon fillet, quinoa, steamed greens",
      portion_guidance: "1 plate",
      approximate_calories: 520,
      time_suggestion: "19:30",
      sort_order: 4,
      completion: null,
    },
    {
      id: "demo-item-snack3",
      meal_type: "snack",
      title: "Herbal Tea",
      description: null,
      suggested_foods: "Chamomile or mint tea, no sugar",
      portion_guidance: "1 cup",
      approximate_calories: 5,
      time_suggestion: "21:00",
      sort_order: 5,
      completion: "completed",
    },
  ],
};

// ── Check-in ───────────────────────────────────────────────────────────

export const DEMO_CHECKIN_TODAY: DailyCheckin = {
  id: "demo-checkin-today",
  checkin_date: new Date().toISOString().slice(0, 10),
  energy: "good",
  hunger: "normal",
  mood: "good",
  note: "Felt strong on today's walk.",
};

export const DEMO_CHECKINS_7D: DailyCheckin[] = [
  DEMO_CHECKIN_TODAY,
  {
    id: "demo-checkin-1",
    checkin_date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
    energy: "normal",
    hunger: "normal",
    mood: "neutral",
    note: null,
  },
  {
    id: "demo-checkin-2",
    checkin_date: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10),
    energy: "good",
    hunger: "low",
    mood: "good",
    note: "Great energy after 8 hours of sleep.",
  },
];

// ── Friends / social ───────────────────────────────────────────────────

const AHMED_PROFILE = {
  id: DEMO_FRIEND_AHMED_ID,
  username: "ahmed.youssef",
  full_name: "Ahmed Youssef",
  avatar_url: null,
};
const MONA_PROFILE = {
  id: DEMO_FRIEND_MONA_ID,
  username: "mona.saeed",
  full_name: "Mona Saeed",
  avatar_url: null,
};

export const DEMO_FRIENDS: FriendshipRow[] = [
  {
    id: "demo-friendship-ahmed",
    requester_id: DEMO_USER_ID,
    addressee_id: DEMO_FRIEND_AHMED_ID,
    status: "accepted",
    created_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    other: AHMED_PROFILE,
  },
  {
    id: "demo-friendship-mona",
    requester_id: DEMO_FRIEND_MONA_ID,
    addressee_id: DEMO_USER_ID,
    status: "accepted",
    created_at: new Date(Date.now() - 45 * 86_400_000).toISOString(),
    other: MONA_PROFILE,
  },
];

export const DEMO_INCOMING_REQUESTS: FriendshipRow[] = [];
export const DEMO_SENT_REQUESTS: FriendshipRow[] = [];

export const DEMO_ACTIVITY_FEED: FeedEvent[] = [
  {
    id: "demo-feed-ahmed",
    type: "activity",
    userId: DEMO_FRIEND_AHMED_ID,
    user: AHMED_PROFILE,
    summary: "Completed a 20-minute walk",
    detail: "20 min",
    at: todayAt(9, 45),
  },
  {
    id: "demo-feed-mona",
    type: "activity",
    userId: DEMO_FRIEND_MONA_ID,
    user: MONA_PROFILE,
    summary: "Reached 8,000 steps",
    detail: "8,000 steps",
    at: todayAt(17, 10),
  },
];

export const DEMO_FRIEND_PUBLIC_PROFILE: Record<string, PublicProfileSummary> = {
  [DEMO_FRIEND_AHMED_ID]: AHMED_PROFILE,
  [DEMO_FRIEND_MONA_ID]: MONA_PROFILE,
  // Sarah's own public profile — needed so getPublicProfile(DEMO_USER_ID)
  // resolves correctly wherever a caller looks a patient/friend id up
  // generically (e.g. the doctor's own patient list includes Sarah as one
  // of the doctor's patients, and NativeDoctorPatientProfile calls
  // getPublicProfile(patientId) regardless of which demo patient it is).
  [DEMO_USER_ID]: {
    id: DEMO_USER_ID,
    username: DEMO_PROFILE.username,
    full_name: DEMO_PROFILE.full_name,
    avatar_url: DEMO_PROFILE.avatar_url,
  },
};

// ── Messaging ──────────────────────────────────────────────────────────

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: DEMO_CONVERSATION_ID,
    otherUser: AHMED_PROFILE,
    lastMessage: "Nice work on today's walk!",
    lastMessageAt: todayAt(9, 50),
    unread: true,
  },
];

export const DEMO_MESSAGES: Message[] = [
  {
    id: "demo-msg-1",
    conversation_id: DEMO_CONVERSATION_ID,
    sender_id: DEMO_USER_ID,
    content: "Just finished lunch, heading out for my walk soon.",
    created_at: todayAt(13, 30),
  },
  {
    id: "demo-msg-2",
    conversation_id: DEMO_CONVERSATION_ID,
    sender_id: DEMO_FRIEND_AHMED_ID,
    content: "Nice work on today's walk!",
    created_at: todayAt(9, 50),
  },
];

// ── Membership / consultations ────────────────────────────────────────

export const DEMO_SUBSCRIPTION: Subscription = {
  id: "demo-subscription",
  package_id: "premium",
  status: "active",
  current_period_start: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  current_period_end: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  consultation_credit_limit: 2,
  consultation_credits_used: 1,
};

// Clearly labelled as a demo example per the explicit instruction — never
// presented as a real scheduled appointment.
export const DEMO_CONSULTATION: ConsultationRequest = {
  id: "demo-consultation",
  appointment_start: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  appointment_end: new Date(Date.now() + 3 * 86_400_000 + 30 * 60_000).toISOString(),
  client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  consultation_type: "Follow-up (Demo Example)",
  reason: "Demo preview — illustrative consultation, not a real booking.",
  status: "confirmed",
  credit_status: "confirmed",
  google_calendar_event_id: null,
  google_meet_url: null,
  cancelled_at: null,
  created_at: new Date().toISOString(),
};

// ── Doctor-side ────────────────────────────────────────────────────────

export const DEMO_PATIENTS: PatientSummary[] = [
  {
    id: DEMO_USER_ID,
    username: "sarah.fit",
    full_name: "Sarah Ahmed",
    avatar_url: null,
    relationshipId: "demo-rel-sarah",
    status: "active",
  },
  {
    id: DEMO_FRIEND_AHMED_ID,
    username: "ahmed.youssef",
    full_name: "Ahmed Youssef",
    avatar_url: null,
    relationshipId: "demo-rel-ahmed",
    status: "active",
  },
  {
    id: DEMO_FRIEND_MONA_ID,
    username: "mona.saeed",
    full_name: "Mona Saeed",
    avatar_url: null,
    relationshipId: "demo-rel-mona",
    status: "active",
  },
];

export const DEMO_NEEDS_REVIEW: PatientNeedsReview[] = [
  {
    patientId: DEMO_FRIEND_AHMED_ID,
    full_name: "Ahmed Youssef",
    username: "ahmed.youssef",
    reason: "no_recent_meals",
  },
];

export const DEMO_DOCTOR_CONSULTATIONS: ConsultationRequest[] = [DEMO_CONSULTATION];

/** Keyed lookup so doctor screens can render plausible per-patient detail regardless of which demo patient id is in the URL. */
export const DEMO_PATIENT_DETAIL: Record<
  string,
  { bodyProfile: BodyProfile; target: DailyTarget; waterTodayMl: number }
> = {
  [DEMO_USER_ID]: { bodyProfile: DEMO_BODY_PROFILE, target: DEMO_TARGET, waterTodayMl: 1800 },
  [DEMO_FRIEND_AHMED_ID]: {
    bodyProfile: {
      ...DEMO_BODY_PROFILE,
      biological_sex: "male",
      weight_kg: 82,
      goal: "maintain_weight",
    },
    target: { ...DEMO_TARGET, daily_target: 2400, source: "doctor" },
    waterTodayMl: 400,
  },
  [DEMO_FRIEND_MONA_ID]: {
    bodyProfile: { ...DEMO_BODY_PROFILE, weight_kg: 60, goal: "gain_weight" },
    target: { ...DEMO_TARGET, daily_target: 2000 },
    waterTodayMl: 1500,
  },
};

/** Richer per-patient row data for the Doctor Command Center's patient list (§43-44). */
export interface DemoPatientOverview {
  patientId: string;
  full_name: string;
  username: string;
  programDay: number | null;
  programTotalDays: number | null;
  lastMealAgo: string | null;
  caloriesToday: number | null;
  caloriesTarget: number | null;
  steps: number | null;
  status: "active" | "needs_review" | "no_recent_logs" | "program_pending";
}

export const DEMO_PATIENT_OVERVIEWS: DemoPatientOverview[] = [
  {
    patientId: DEMO_USER_ID,
    full_name: "Sarah Ahmed",
    username: "sarah.fit",
    programDay: 8,
    programTotalDays: 30,
    lastMealAgo: "1h ago",
    caloriesToday: 1540,
    caloriesTarget: 2100,
    steps: 7420,
    status: "active",
  },
  {
    patientId: DEMO_FRIEND_AHMED_ID,
    full_name: "Ahmed Youssef",
    username: "ahmed.youssef",
    programDay: 8,
    programTotalDays: 30,
    lastMealAgo: "3 days ago",
    caloriesToday: 0,
    caloriesTarget: 2400,
    steps: null,
    status: "needs_review",
  },
  {
    patientId: DEMO_FRIEND_MONA_ID,
    full_name: "Mona Saeed",
    username: "mona.saeed",
    programDay: null,
    programTotalDays: null,
    lastMealAgo: "4h ago",
    caloriesToday: 1180,
    caloriesTarget: 2000,
    steps: 8900,
    status: "program_pending",
  },
];

export type DoctorActivityKind = "meal" | "weight" | "movement" | "checkin" | "program";

export interface DemoDoctorActivityEvent {
  id: string;
  patientName: string;
  kind: DoctorActivityKind;
  summary: string;
  at: string;
}

/** "Recent Patient Activity" feed (§41) — a doctor-facing timeline across all patients, distinct from the friends-only DEMO_ACTIVITY_FEED above. */
export const DEMO_DOCTOR_ACTIVITY_FEED: DemoDoctorActivityEvent[] = [
  {
    id: "doc-feed-1",
    patientName: "Sarah",
    kind: "meal",
    summary: "logged Lunch — 610 kcal",
    at: todayAt(13, 15),
  },
  {
    id: "doc-feed-2",
    patientName: "Mona",
    kind: "weight",
    summary: "updated weight",
    at: todayAt(8, 5),
  },
  {
    id: "doc-feed-3",
    patientName: "Sarah",
    kind: "movement",
    summary: "completed a 20-minute walk",
    at: todayAt(9, 45),
  },
  {
    id: "doc-feed-4",
    patientName: "Ahmed",
    kind: "checkin",
    summary: "missed today's check-in",
    at: todayAt(7, 0),
  },
];

export const DEMO_ACTIVE_PROGRAMS_SUMMARY = { active: 2, draft: 1 };

/** A synthetic photo-scan result used only by the demo Scan -> Food Result flow — never a real Gemini call. */
export const DEMO_SCAN_RESULT: FoodScanResult = {
  foodDetected: true,
  foods: [
    foodItem("Grilled Chicken Breast", "1 piece (150g)", 250, 38, 0, 9),
    foodItem("Steamed Rice", "1 cup", 210, 4, 45, 1),
    foodItem("Mixed Vegetables", "1 cup", 90, 3, 16, 2),
  ],
  totalEstimatedCalories: 550,
  confidence: "medium",
  notes: "Demo preview result — not a real Gemini analysis.",
};
