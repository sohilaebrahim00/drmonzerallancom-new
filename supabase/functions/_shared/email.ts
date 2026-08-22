// Shared email sending + branded templates for Supabase Edge Functions.
// Uses Resend's HTTP API directly (no npm dependency needed in Deno).
//
// Required secret: RESEND_API_KEY
// Required config: EMAIL_FROM, ADMIN_NOTIFICATION_EMAIL

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "";
export const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "";

const NAVY = "#17233b";
const PRIMARY = "#253fa4";
const TURQUOISE = "#38b7c7";
const LIGHT = "#eaf8fa";

/** Sends an email via Resend. Never throws on missing config — logs and no-ops instead, so a missing secret degrades gracefully rather than crashing the caller (e.g. the Stripe webhook). */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.warn("[email] RESEND_API_KEY or EMAIL_FROM not configured — skipping send.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    // Never log the API key or full request/response body (may include PII).
    console.error(`[email] Resend request failed with status ${res.status}`);
  }
}

/** Escapes user-supplied text before interpolating into HTML emails. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(bodyHtml: string): string {
  return `
  <div style="background:${LIGHT};padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:linear-gradient(135deg,${NAVY},${PRIMARY});padding:28px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">Monzer Allan</span>
          <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">Nutrition Specialist &amp; Pharmacist</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;color:${NAVY};font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#8a94a6;font-size:11px;">
          This is an automated message from the Monzer Allan website.
        </td>
      </tr>
    </table>
  </div>`;
}

// `href` is interpolated into an HTML attribute, so every caller passing a
// value that originated in a request body MUST escapeHtml() it first —
// escaping the double quote is what stops the value closing the attribute
// and injecting a phishing link into the doctor's own inbox.
function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;background:${TURQUOISE};color:${NAVY};text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">${label}</a>`;
}

interface NewMemberEmailInput {
  siteUrl: string;
  fullName: string;
  email: string;
  phone: string | null;
  preferredContactMethod: string;
  packageName: string;
  priceLabel: string;
  stripeCustomerId: string;
}

export function adminNewMemberEmail(input: NewMemberEmailInput) {
  const waHref = input.phone ? `https://wa.me/${input.phone.replace(/[^\d]/g, "")}` : null;
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">New Membership — ${escapeHtml(input.packageName)}</h2>
    <table role="presentation" style="width:100%;font-size:13px;">
      <tr><td style="padding:4px 0;color:#8a94a6;">Name</td><td>${escapeHtml(input.fullName)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Email</td><td>${escapeHtml(input.email)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Phone</td><td>${input.phone ? escapeHtml(input.phone) : "Not provided"}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Preferred contact</td><td>${escapeHtml(input.preferredContactMethod)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Package</td><td>${escapeHtml(input.packageName)} — ${escapeHtml(input.priceLabel)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Status</td><td>Active</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Stripe customer</td><td>${escapeHtml(input.stripeCustomerId)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Date</td><td>${new Date().toLocaleString()}</td></tr>
    </table>
    ${ctaButton("Email Customer", `mailto:${escapeHtml(input.email)}`)}
    ${waHref ? " " + ctaButton("WhatsApp Customer", waHref) : ""}
  `;
  return { subject: `New Dr. Monzer Allan Membership — ${input.packageName}`, html: shell(body) };
}

interface WelcomeEmailInput {
  siteUrl: string;
  fullName: string;
  packageName: string;
  consultationCredits: number;
  isVip: boolean;
  /**
   * "membership" = a recurring monthly plan, where the credits genuinely do
   * renew each month. "program" = a one-time Diet/Treatment package, where
   * they do not. Defaults to "membership" so existing callers keep their
   * wording, but the one-time path MUST pass "program": telling a one-time
   * buyer they get N credits "per month" promises something never delivered.
   */
  packageKind?: "membership" | "program";
}

export function customerWelcomeEmail(input: WelcomeEmailInput) {
  const credits = `<strong>${input.consultationCredits} consultation credit${input.consultationCredits === 1 ? "" : "s"}</strong>`;
  const entitlement =
    input.packageKind === "program"
      ? `Your <strong>${escapeHtml(input.packageName)}</strong> program is now active, including
    ${credits} to use whenever you're ready — they don't expire monthly.`
      : `Your <strong>${escapeHtml(input.packageName)}</strong> membership is now active, including
    ${credits} per month.`;
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">Welcome, ${escapeHtml(input.fullName)}</h2>
    <p>${entitlement}</p>
    <p>Set your password to sign in and access your member dashboard, where you can request
    consultations and track your credits.</p>
    ${input.isVip ? `<p>As a VIP Elite member, your Priority Hotline details will appear inside your authenticated dashboard.</p>` : ""}
    ${ctaButton("Activate My Account", `${input.siteUrl}/reset-password`)}
    <p style="margin-top:20px;">Questions? Reach out any time via the
    <a href="${input.siteUrl}/contact" style="color:${PRIMARY};">Contact page</a>.</p>
  `;
  return { subject: "Welcome to Your Dr. Monzer Allan Membership", html: shell(body) };
}

interface ContactInquiryEmailInput {
  fullName: string;
  email: string;
  phone: string | null;
  preferredContactMethod: string;
  subject: string;
  message: string;
  sourcePage: string;
}

export function adminContactInquiryEmail(input: ContactInquiryEmailInput) {
  const waHref = input.phone ? `https://wa.me/${input.phone.replace(/[^\d]/g, "")}` : null;
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">New Website Inquiry — ${escapeHtml(input.subject || "General")}</h2>
    <table role="presentation" style="width:100%;font-size:13px;">
      <tr><td style="padding:4px 0;color:#8a94a6;">Name</td><td>${escapeHtml(input.fullName)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Email</td><td>${escapeHtml(input.email)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Phone</td><td>${input.phone ? escapeHtml(input.phone) : "Not provided"}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Preferred contact</td><td>${escapeHtml(input.preferredContactMethod)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Source page</td><td>${escapeHtml(input.sourcePage)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Date</td><td>${new Date().toLocaleString()}</td></tr>
    </table>
    <p style="margin-top:16px;padding:12px;background:${LIGHT};border-radius:8px;">${escapeHtml(input.message)}</p>
    ${ctaButton("Reply by Email", `mailto:${escapeHtml(input.email)}`)}
    ${waHref ? " " + ctaButton("Follow Up on WhatsApp", waHref) : ""}
  `;
  return { subject: `New Website Inquiry — ${input.subject || "General"}`, html: shell(body) };
}

export function customerContactAckEmail(input: { fullName: string; siteUrl: string }) {
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">Thanks for reaching out, ${escapeHtml(input.fullName)}</h2>
    <p>We've received your message and will get back to you as soon as possible.</p>
    ${ctaButton("Explore Memberships", `${input.siteUrl}/packages`)}
  `;
  return { subject: "We've Received Your Message", html: shell(body) };
}

interface ConsultationConfirmedClientEmailInput {
  siteUrl: string;
  clientName: string;
  clientLocalTime: string;
  clientTimeZone: string;
  dubaiTime: string;
  meetUrl: string;
  packageName: string;
  creditsRemaining: number;
  creditsLimit: number;
}

export function consultationConfirmedClientEmail(input: ConsultationConfirmedClientEmailInput) {
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">Your consultation is confirmed, ${escapeHtml(input.clientName)}</h2>
    <table role="presentation" style="width:100%;font-size:13px;">
      <tr><td style="padding:4px 0;color:#8a94a6;">Your time</td><td>${escapeHtml(input.clientLocalTime)} (${escapeHtml(input.clientTimeZone)})</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Doctor's time</td><td>${escapeHtml(input.dubaiTime)} (Dubai)</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Membership</td><td>${escapeHtml(input.packageName)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Consultation credits</td><td>${input.creditsRemaining} of ${input.creditsLimit} remaining</td></tr>
    </table>
    ${ctaButton("Join Google Meet", input.meetUrl)}
    <p style="margin-top:20px;">Need to make a change? Visit your
    <a href="${input.siteUrl}/account/consultations" style="color:${PRIMARY};">account</a> to review your
    consultation, or reach out via the <a href="${input.siteUrl}/contact" style="color:${PRIMARY};">Contact page</a>.</p>
  `;
  return { subject: "Your Consultation with Dr. Monzer Allan is Confirmed", html: shell(body) };
}

interface ConsultationConfirmedAdminEmailInput {
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  packageName: string;
  dubaiTime: string;
  meetUrl: string;
}

export function consultationConfirmedAdminEmail(input: ConsultationConfirmedAdminEmailInput) {
  const body = `
    <h2 style="margin:0 0 12px;font-size:18px;">New Consultation Scheduled — ${escapeHtml(input.clientName)}</h2>
    <table role="presentation" style="width:100%;font-size:13px;">
      <tr><td style="padding:4px 0;color:#8a94a6;">Client</td><td>${escapeHtml(input.clientName)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Email</td><td>${escapeHtml(input.clientEmail)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Phone</td><td>${input.clientPhone ? escapeHtml(input.clientPhone) : "Not provided"}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Membership</td><td>${escapeHtml(input.packageName)}</td></tr>
      <tr><td style="padding:4px 0;color:#8a94a6;">Dubai time</td><td>${escapeHtml(input.dubaiTime)}</td></tr>
    </table>
    ${ctaButton("Join Google Meet", input.meetUrl)}
  `;
  return { subject: `New Consultation Scheduled — ${input.clientName}`, html: shell(body) };
}
