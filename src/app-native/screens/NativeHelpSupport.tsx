import { useState, type FormEvent } from "react";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { business } from "@/data/business";
import { whatsappLink } from "@/config/contact";
import { submitContact, type ContactSubmitResult } from "@/services/contactService";
import { openExternal } from "@/lib/externalLink";

export default function NativeHelpSupport() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ContactSubmitResult | null>(null);

  const waHref = whatsappLink("Hello, I'm using the Dr. Monzer Allan app and need help.");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    const res = await submitContact({
      name,
      email,
      phone: "",
      preferredContactMethod: "email",
      subject: "App support request",
      message,
    });
    setSending(false);
    setResult(res);
    if (res.channel === "email" || res.channel === "whatsapp") {
      await openExternal(res.href);
    }
  }

  return (
    <AppScreen title="Help & Support" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-4">
      {waHref && (
        <button
          type="button"
          onClick={() => openExternal(waHref)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-turquoise/40 bg-turquoise/10 p-4 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-turquoise/20 text-turquoise">
            <MessageCircle className="h-4.5 w-4.5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-navy">Message us on WhatsApp</span>
            <span className="block text-xs text-muted-foreground">
              Fastest way to reach the team
            </span>
          </span>
        </button>
      )}

      {business.email && (
        <a
          href={`mailto:${business.email}`}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Mail className="h-4.5 w-4.5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-navy">Email</span>
            <span className="block text-xs text-muted-foreground">{business.email}</span>
          </span>
        </a>
      )}

      <p className="mt-6 px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Or send a message
      </p>
      {result?.channel === "submitted" ? (
        <Alert className="mt-2 border-turquoise/40 bg-turquoise/10 text-navy">
          <AlertDescription>
            Thanks — your message has been sent. We'll be in touch soon.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          {result?.channel === "error" && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="How can we help?"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit" disabled={sending} className="w-full cursor-pointer">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Message
          </Button>
        </form>
      )}
    </AppScreen>
  );
}
