import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
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

/**
 * The schema is a function of `t` and built inside the component, because
 * validation messages are the ones a patient reads when something has gone
 * wrong and they must be in their language. At module scope `t` does not
 * exist — and a schema built once at import time would freeze whichever
 * language happened to be active on first load.
 */
const buildLoginSchema = (t: TranslateFn) =>
  z.object({
    email: z.string().trim().email(t("auth.emailInvalid")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

type LoginValues = z.infer<ReturnType<typeof buildLoginSchema>>;

export default function LoginPage() {
  const t = useTranslate();
  const loginSchema = useMemo(() => buildLoginSchema(t), [t]);
  const { user, loading, configured, signIn } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!loading && user) {
    return <Navigate to="/account" replace />;
  }

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(values.email, values.password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate("/account");
  }

  return (
    <AuthLayout
      title={t("auth.signInTitle")}
      subtitle={t("auth.signInBody")}
      footer={
        <>
          New here?{" "}
          <Link to="/packages" className="font-semibold text-primary hover:text-turquoise">
            {t("auth.chooseProgram")}
          </Link>
        </>
      }
    >
      <Seo
        title="Sign In"
        description="Sign in to your Monzer Allan member account."
        path="/login"
        noindex
      />

      {!configured && (
        <Alert className="mb-5 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription>{t("auth.signInUnavailable")}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>{t("auth.passwordLabel")}</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:text-turquoise"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <FormControl>
                  <PasswordField autoComplete="current-password" {...field} />
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
            disabled={submitting || !configured}
            className="w-full cursor-pointer justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.signingIn")}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> {t("auth.logIn")}
              </>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
