import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
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

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  // `session` comes from AuthContext, which is populated either by an
  // existing sign-in or by Supabase consuming the recovery token in the URL
  // fragment when this page loads from a real reset email.
  //
  // Without one, supabase.auth.updateUser cannot work — it updates the
  // CURRENT user, and there isn't one. A paying customer was sent here by the
  // welcome email, which carried no token, and got a generic failure with no
  // idea what to do. `loading` matters because the recovery token is consumed
  // asynchronously: judging the session before it settles would reject
  // someone who arrived from a perfectly good link.
  const { updatePassword, configured, session, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    setError(null);
    setNoSession(false);

    // Say what is actually wrong, and where to go, rather than letting this
    // fall through to a generic error the person cannot act on.
    if (!loading && !session) {
      setSubmitting(false);
      setNoSession(true);
      return;
    }

    const { error: updateError } = await updatePassword(values.password);
    setSubmitting(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    setSuccess(true);
    window.setTimeout(() => navigate("/account"), 1800);
  }

  return (
    <AuthLayout
      title="Set a New Password"
      subtitle="Choose a new password for your member account."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:text-turquoise">
          Back to Sign In
        </Link>
      }
    >
      <Seo
        title="Reset Password"
        description="Set a new password for your Monzer Allan member account."
        path="/reset-password"
        noindex
      />

      {success ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-turquoise" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your password has been updated. Redirecting to your account…
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {!configured && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertDescription>
                  Password reset isn&apos;t connected yet. This link must be opened from a real
                  reset email once Supabase is configured.
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
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
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordField autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {noSession && (
              <Alert role="alert" className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertDescription>
                  This page only works when it&apos;s opened from a password reset email, because
                  that link is what proves the account is yours. Nothing is wrong with your account.{" "}
                  <Link
                    to="/forgot-password"
                    className="font-semibold underline underline-offset-2"
                  >
                    Send yourself a reset link
                  </Link>{" "}
                  and open this page from that email.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting || !configured}
              className="w-full cursor-pointer justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Update Password
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
