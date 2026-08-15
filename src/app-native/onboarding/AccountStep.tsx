import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleNotch, SignIn } from "@phosphor-icons/react";

import { FreeSignUpForm } from "@/app-native/components/FreeSignUpForm";
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

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});
type SignInValues = z.infer<typeof signInSchema>;

function QuickSignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(values.email, values.password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
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
          disabled={submitting}
          className="w-full cursor-pointer justify-center"
        >
          {submitting ? (
            <CircleNotch className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <SignIn className="h-4 w-4" /> Sign In
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export function AccountStep({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  return (
    <div className="native-safe-top native-safe-bottom flex h-dvh flex-col bg-background px-6">
      <div className="flex-1 overflow-y-auto py-6">
        <p className="font-display text-xl font-extrabold tracking-tight text-navy">
          {mode === "signup" ? "Create Your Free Account" : "Welcome Back"}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {mode === "signup"
            ? "No payment required. You can add a membership later if you want consultations."
            : "Sign in to continue where you left off."}
        </p>

        <div className="mt-5">
          {mode === "signup" ? (
            <FreeSignUpForm onSuccess={onSuccess} />
          ) : (
            <QuickSignInForm onSuccess={onSuccess} />
          )}
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-5 w-full cursor-pointer text-center text-xs font-semibold text-primary"
        >
          {mode === "signup"
            ? "Already have an account? Sign In"
            : "New here? Create a Free Account"}
        </button>
      </div>
    </div>
  );
}
