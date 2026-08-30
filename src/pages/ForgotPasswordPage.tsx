import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  z.object({
    email: z.string().trim().email(t("auth.emailInvalid")),
  });

type Values = z.infer<ReturnType<typeof buildSchema>>;

export default function ForgotPasswordPage() {
  const t = useTranslate();
  const schema = useMemo(() => buildSchema(t), [t]);
  const { resetPasswordForEmail, configured } = useAuth();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Pre-fill from ?email=. The welcome email a buyer receives after paying
  // links here with their address already attached, so setting a password is
  // one click rather than retyping it. This page read no parameter at all
  // before — nothing else links here with one, so nothing else is affected.
  //
  // Not a trust decision: the value only populates a form field the visitor
  // can edit, and resetPasswordForEmail always answers with the same neutral
  // confirmation, so a tampered address reveals nothing.
  const prefilledEmail = (searchParams.get("email") ?? "").trim().slice(0, 320);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    // Always show the same neutral confirmation regardless of whether the
    // email matches an account, to avoid account enumeration.
    await resetPasswordForEmail(values.email);
    setSubmitting(false);
    setSent(true);
  }

  return (
    <AuthLayout
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotBody")}
      footer={
        <Link to="/login" className="font-semibold text-primary hover:text-turquoise">
          {t("auth.backToSignIn")}
        </Link>
      }
    >
      <Seo
        title="Forgot Password"
        description="Reset your Monzer Allan member account password."
        path="/forgot-password"
        noindex
      />

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-turquoise" />
          <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
            {t("auth.resetSent")}
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {!configured && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertDescription>{t("auth.forgotUnavailable")}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="jane@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={submitting || !configured}
              className="w-full cursor-pointer justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {t("auth.sendResetInstructions")}
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
