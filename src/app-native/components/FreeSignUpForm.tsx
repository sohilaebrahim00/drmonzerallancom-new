import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleNotch, UserPlus } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/auth/PasswordField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { checkUsernameAvailable, setBasicProfile } from "@/services/profileService";

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_.]{3,24}$/, "3-24 characters: letters, numbers, . or _ only."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

/**
 * Real, free account creation — no Stripe, no membership selection, no
 * payment gate. Distinct from the marketing website's /join (JoinPage,
 * which starts a paid-membership Stripe Checkout flow and is left
 * completely unchanged) — this is what the app experience's /join and
 * onboarding "account" step use instead.
 */
export function FreeSignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpValues) {
    setSubmitting(true);
    setError(null);

    // "unavailable" blocks submission (a confirmed collision/reserved
    // name); "unknown" (RPC unreachable) does not — the database's unique
    // index on profiles.username is still the real source of truth and
    // will reject a genuine collision at save time with its own real
    // error. Blocking here on every check failure was a real bug: it
    // showed "taken or not allowed" even when the backend just couldn't be
    // reached, which is misleading, not accurate.
    const availability = await checkUsernameAvailable(values.username);
    if (availability === "unavailable") {
      setSubmitting(false);
      form.setError("username", { message: "That username is taken or not allowed." });
      return;
    }

    const signUpOutcome = await signUp(values.email, values.password, values.fullName);
    if (signUpOutcome.error) {
      setSubmitting(false);
      setError(signUpOutcome.error);
      return;
    }

    // Found via live testing: this project has email confirmation enabled,
    // so signUp() succeeding does NOT mean there's an active session yet —
    // there is no auth.uid() for setBasicProfile() to write a profile
    // against until the visitor confirms. Show that honestly instead of
    // silently trying to save and failing with a confusing "Not signed in"
    // error. Their username is re-collected by the onboarding wizard's
    // "basics" step once they do sign in (see NativeOnboarding.tsx) — never
    // lost, just asked for again since nothing could be persisted yet.
    if (signUpOutcome.needsEmailConfirmation) {
      setSubmitting(false);
      setConfirmationEmail(values.email);
      return;
    }

    const profileResult = await setBasicProfile({
      fullName: values.fullName,
      username: values.username,
    });
    setSubmitting(false);
    if (!profileResult.ok) {
      setError(profileResult.error);
      return;
    }
    onSuccess();
  }

  if (confirmationEmail) {
    return (
      <Alert className="border-turquoise/30 bg-turquoise/10 text-navy">
        <AlertDescription>
          We sent a confirmation link to <strong>{confirmationEmail}</strong>. Open it to activate
          your account, then sign in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">@</span>
                  <Input autoComplete="off" placeholder="jane_fit" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="jane@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordField autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer justify-center"
        >
          {submitting ? (
            <>
              <CircleNotch className="h-4 w-4 animate-spin" /> Creating your account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Create Free Account
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
