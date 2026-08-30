import { useMemo, useState } from "react";
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
import { useTranslate, type TranslateFn } from "@/i18n";

/** Built inside the component — see the note in LoginPage. */
const buildSchema = (t: TranslateFn) =>
  z
    .object({
      password: z.string().min(8, t("auth.passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

type Values = z.infer<ReturnType<typeof buildSchema>>;

export default function ResetPasswordPage() {
  const t = useTranslate();
  const schema = useMemo(() => buildSchema(t), [t]);
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
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetBody")}
      footer={
        <Link to="/login" className="font-semibold text-primary hover:text-turquoise">
          {t("auth.backToSignIn")}
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
          <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
            {t("auth.passwordUpdated")}
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {!configured && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertDescription>{t("auth.resetUnavailable")}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.newPasswordLabel")}</FormLabel>
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
                  <FormLabel>{t("auth.confirmPasswordLabel")}</FormLabel>
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
                    {t("auth.sendYourselfLink")}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.updating")}
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> {t("auth.updatePassword")}
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
