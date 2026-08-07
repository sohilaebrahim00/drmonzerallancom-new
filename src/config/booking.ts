// Booking is provider-independent: the UI talks to this module, which
// resolves to a concrete embeddable scheduler. Today only Google Calendar
// Appointment Schedules are implemented; adding Cal.com later means adding a
// "calcom" case here and in <SchedulerEmbed />, without touching the booking
// pages themselves.
export type BookingProviderId = "google" | "calcom";

export type PackageSlug = "basic" | "premium" | "vip-elite";

export interface SchedulingRule {
  minNoticeDays: number;
  minNoticeLabel: string;
  sessionsPerMonth: number;
  priorityLabel: string;
}

export const schedulingRules: Record<PackageSlug, SchedulingRule> = {
  basic: {
    minNoticeDays: 3,
    minNoticeLabel: "Booked at least 3 days in advance",
    sessionsPerMonth: 2,
    priorityLabel: "Standard booking",
  },
  premium: {
    minNoticeDays: 2,
    minNoticeLabel: "Priority booking at least 2 days in advance",
    sessionsPerMonth: 3,
    priorityLabel: "Priority booking",
  },
  "vip-elite": {
    minNoticeDays: 0,
    minNoticeLabel: "Same-day sessions, subject to availability",
    sessionsPerMonth: 5,
    priorityLabel: "Highest priority",
  },
};

// Real Google Calendar Appointment Schedule links, one per package. Each
// schedule should be configured in Google Calendar with Google Meet as the
// location, and with the minimum-notice / buffer settings that match the
// rules above — this app cannot enforce those from the outside.
const googleEmbedUrls: Record<PackageSlug, string | undefined> = {
  basic: import.meta.env.VITE_GOOGLE_BOOKING_BASIC_URL,
  premium: import.meta.env.VITE_GOOGLE_BOOKING_PREMIUM_URL,
  "vip-elite": import.meta.env.VITE_GOOGLE_BOOKING_VIP_URL,
};

export interface BookingProviderConfig {
  id: BookingProviderId;
  embedUrl?: string;
}

export function getBookingProvider(packageSlug: PackageSlug): BookingProviderConfig {
  return { id: "google", embedUrl: googleEmbedUrls[packageSlug]?.trim() || undefined };
}

export function isBookingConfigured(packageSlug: PackageSlug) {
  return Boolean(getBookingProvider(packageSlug).embedUrl);
}
