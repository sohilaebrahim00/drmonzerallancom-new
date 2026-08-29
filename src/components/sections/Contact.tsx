import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SocialLinks } from "@/components/common/SocialLinks";
import { BookingButton } from "@/components/booking/BookingButton";
import { business, tel } from "@/data/business";
import { whatsappLink } from "@/config/contact";
import { submitContact, type ContactSubmitResult } from "@/services/contactService";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .regex(/^[+()\-\s\d]+$/, "Please enter a valid phone number."),
  preferredContactMethod: z.enum(["whatsapp", "email", "either"]),
  subject: z.string().trim().max(200),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(4000, "Please keep your message under 4000 characters."),
  companyWebsite: z.string().max(0),
});

type ContactValues = z.infer<typeof contactSchema>;

const CONTACT_METHODS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "either", label: "Either" },
] as const;

export function Contact() {
  const [result, setResult] = useState<ContactSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferredContactMethod: "either",
      subject: "",
      message: "",
      companyWebsite: "",
    },
  });

  async function onSubmit(values: ContactValues) {
    setSubmitting(true);
    const outcome = await submitContact(values);
    if (outcome.channel === "email" || outcome.channel === "whatsapp") {
      window.open(outcome.href, outcome.channel === "whatsapp" ? "_blank" : "_self");
    }
    setResult(outcome);
    setSubmitting(false);
    if (outcome.channel !== "error") {
      form.reset();
    }
  }

  const inquiryWhatsapp = whatsappLink("Hi Monzer, I'd like to ask about your nutrition services.");
  const hasContactInfo =
    business.phone || business.email || business.fullAddress || business.officeHours?.length;

  return (
    <section id="contact" className="relative py-20 sm:py-28" aria-labelledby="contact-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Contact"
          title="Let's Start Your Nutrition Journey"
          description="Reach out with questions, or book your first session directly — whichever is easiest for you."
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              {hasContactInfo ? (
                <ul className="space-y-5">
                  {business.phone && (
                    <li className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Phone className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Phone
                        </p>
                        <a
                          href={tel(business.phone)}
                          className="text-sm font-semibold text-navy hover:text-turquoise"
                        >
                          {business.phone}
                        </a>
                      </div>
                    </li>
                  )}
                  {business.email && (
                    <li className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Mail className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Email
                        </p>
                        <a
                          href={`mailto:${business.email}`}
                          className="text-sm font-semibold text-navy hover:text-turquoise"
                        >
                          {business.email}
                        </a>
                      </div>
                    </li>
                  )}
                  {business.fullAddress && (
                    <li className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <MapPin className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Location
                        </p>
                        <p className="text-sm font-semibold text-navy">{business.fullAddress}</p>
                      </div>
                    </li>
                  )}
                  {business.officeHours && business.officeHours.length > 0 && (
                    <li className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Clock className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Office Hours
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {business.officeHours.map((line) => (
                            <p key={line} className="text-sm text-navy">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Direct contact details are being finalized. In the meantime, use the form or
                  WhatsApp to reach us.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-6">
                {inquiryWhatsapp && (
                  <a
                    href={inquiryWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-turquoise"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                <BookingButton size="sm" />
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Follow us
                </span>
                <SocialLinks iconClassName="h-8 w-8" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              {business.googleMapsUrl ? (
                <a
                  href={business.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-64 flex-col items-center justify-center gap-2 bg-secondary/50 p-6 text-center transition-colors hover:bg-secondary"
                >
                  <MapPin className="h-6 w-6 text-primary" />
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
                    View location on Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </p>
                </a>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 bg-secondary/50 p-6 text-center">
                  <MapPin className="h-6 w-6 text-primary" />
                  <p className="text-sm font-semibold text-navy">
                    Online consultations available worldwide
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    In-person location details are shared upon booking confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-4 py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 16 }}
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-full",
                        result.channel === "error"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-turquoise/15 text-turquoise",
                      )}
                    >
                      {result.channel === "error" ? (
                        <TriangleAlert className="h-9 w-9" />
                      ) : (
                        <CheckCircle2 className="h-9 w-9" />
                      )}
                    </motion.div>
                    {result.channel === "submitted" && (
                      <>
                        <h3 className="font-display text-lg font-bold text-navy">Message sent</h3>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                          Thanks for reaching out — we've received your message and will get back to
                          you soon.
                        </p>
                      </>
                    )}
                    {result.channel === "error" && (
                      <>
                        <h3 className="font-display text-lg font-bold text-navy">
                          Something went wrong
                        </h3>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                          {result.message} Nothing you entered has been sent — please try again.
                        </p>
                      </>
                    )}
                    {result.channel === "email" && (
                      <>
                        <h3 className="font-display text-lg font-bold text-navy">
                          Message ready to send
                        </h3>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                          Your email app should have opened with your message pre-filled. Hit send
                          there, and we'll get back to you soon.
                        </p>
                      </>
                    )}
                    {result.channel === "whatsapp" && (
                      <>
                        <h3 className="font-display text-lg font-bold text-navy">
                          Opening WhatsApp
                        </h3>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                          We've opened WhatsApp with your message pre-filled — send it there and
                          we'll reply as soon as we can.
                        </p>
                      </>
                    )}
                    {result.channel === "unavailable" && (
                      <>
                        <h3 className="font-display text-lg font-bold text-navy">
                          Online submission isn't connected yet
                        </h3>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                          We haven't finished wiring up this form. Please reach out via{" "}
                          {business.instagram ? "Instagram" : "the details above"} in the meantime —
                          nothing you entered has been sent or saved.
                        </p>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setResult(null)}
                    >
                      Back to form
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Jane Doe" autoComplete="name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+1 555 123 4567"
                                    autoComplete="tel"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="jane@email.com"
                                  autoComplete="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="preferredContactMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred contact method</FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                {CONTACT_METHODS.map((method) => (
                                  <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => field.onChange(method.value)}
                                    className={cn(
                                      "cursor-pointer rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                                      field.value === method.value
                                        ? "border-primary bg-secondary/60 text-primary"
                                        : "border-border text-navy/70 hover:border-turquoise",
                                    )}
                                  >
                                    {method.label}
                                  </button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="What's this about?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={5}
                                  placeholder="Tell us about your goals…"
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Please avoid sharing detailed medical history here — a nutrition
                                specialist will follow up to discuss specifics privately.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              tabIndex={-1}
                              autoComplete="off"
                              aria-hidden="true"
                              className="absolute -start-[9999px] h-0 w-0 opacity-0"
                            />
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full cursor-pointer justify-center"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" /> Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
