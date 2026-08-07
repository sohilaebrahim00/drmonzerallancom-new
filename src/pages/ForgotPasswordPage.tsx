import { useState } from "react";
import { Link } from "react-router-dom";
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

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail, configured } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

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
      title="Forgot Password"
      subtitle="Enter your email and we'll send you reset instructions."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:text-turquoise">
          Back to Sign In
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
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for this email, password reset instructions have been sent.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {!configured && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertDescription>Password reset isn&apos;t connected yet.</AlertDescription>
              </Alert>
            )}
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
            <Button
              type="submit"
              disabled={submitting || !configured}
              className="w-full cursor-pointer justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send Reset Instructions
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
