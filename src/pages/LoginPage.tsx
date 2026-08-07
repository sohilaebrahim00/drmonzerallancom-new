import { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
      title="Sign In"
      subtitle="Access your Monzer Allan member account."
      footer={
        <>
          New here?{" "}
          <Link to="/join" className="font-semibold text-primary hover:text-turquoise">
            Create an Account
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
          <AlertDescription>
            Member sign-in isn&apos;t connected yet. Please check back soon, or reach out via the
            Contact page.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
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
                  <FormLabel>Password</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:text-turquoise"
                  >
                    Forgot password?
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
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Log In
              </>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
