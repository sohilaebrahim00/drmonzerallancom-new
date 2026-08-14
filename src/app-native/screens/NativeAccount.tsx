import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarCheck,
  CreditCard,
  Download,
  FileText,
  HeartPulse,
  HelpCircle,
  Info,
  Loader2,
  LogOut,
  MessageCircle,
  PhoneCall,
  Settings2,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Users,
  Zap,
} from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { NativeListRow } from "@/app-native/components/NativeListRow";
import { NativeSheet } from "@/app-native/components/NativeSheet";
import { ProfileHeaderSkeleton } from "@/app-native/components/AppSkeletons";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { business, tel } from "@/data/business";
import { packages } from "@/data/packages";
import { getMySubscription, type Subscription } from "@/services/membershipService";
import { getFullProfile } from "@/services/profileService";
import { downloadJson, exportMyData } from "@/services/dataExportService";
import { requestAccountDeletion } from "@/services/accountService";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-1.5 mt-4 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80 first:mt-0">
      {children}
    </p>
  );
}

export default function NativeAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [exporting, setExporting] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    const outcome = await exportMyData();
    setExporting(false);
    if (outcome.ok) {
      downloadJson(
        `dr-monzer-allan-my-data-${new Date().toISOString().slice(0, 10)}.json`,
        outcome.json,
      );
    }
  }

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const outcome = await requestAccountDeletion();
    setDeleting(false);
    if (!outcome.ok) {
      setDeleteError(outcome.error);
      return;
    }
    navigate("/", { replace: true });
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getFullProfile(user.id), getMySubscription()]).then(([profile, sub]) => {
      if (cancelled) return;
      setFullName(profile?.full_name ?? null);
      setUsername(profile?.username ?? null);
      setSubscription(sub);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const packageInfo = subscription
    ? packages.find((p) => p.slug === subscription.package_id)
    : undefined;
  const eligibleForHotline = Boolean(packageInfo?.hotline && business.vipHotlinePhone);

  if (!user) {
    return (
      <AppScreen title="Account" tabBar className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
          <UserIcon className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-navy">You're not signed in</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Sign in to manage your health profile, program, and consultations.
        </p>
        <div className="mt-5 flex justify-center gap-2.5">
          <Button asChild className="cursor-pointer">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link to="/join">
              <Sparkles className="h-4 w-4" /> Create Account
            </Link>
          </Button>
        </div>

        <div className="mt-8 space-y-0.5 rounded-2xl bg-app-surface p-1.5 text-left">
          <NativeListRow icon={HelpCircle} label="Help & Support" to="/account/help" />
          <NativeListRow icon={Info} label="About Dr. Monzer Allan" to="/about" />
          <NativeListRow icon={Shield} label="Privacy & Security" to="/privacy-policy" />
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Account" tabBar className="mx-auto w-full max-w-lg px-4 pb-6 pt-4">
      {loading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
            {(fullName ?? user.email ?? "U").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold text-navy">
              {fullName ?? "Member"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {username ? `@${username}` : user.email}
            </p>
          </div>
        </div>
      )}

      <SectionLabel>Health</SectionLabel>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow icon={HeartPulse} label="My Health" to="/my-health" />
        <NativeListRow icon={TrendingUp} label="Progress" to="/progress" />
        <NativeListRow icon={CalendarCheck} label="My Program" to="/my-program" />
        <NativeListRow icon={Zap} label="Movement History" to="/activity-history" />
      </div>

      <SectionLabel>Social</SectionLabel>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow icon={Users} label="Friends & Privacy" to="/social" />
        <NativeListRow icon={MessageCircle} label="Messages" to="/social" />
      </div>

      <SectionLabel>Care</SectionLabel>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow icon={Stethoscope} label="Doctor Connection" to="/account/help" />
        <NativeListRow icon={CalendarClock} label="Consultations" to="/consultations" />
        <NativeListRow
          icon={Sparkles}
          label="Membership"
          value={packageInfo?.name ?? "Free account"}
          to="/consultations"
        />
        <NativeListRow icon={CreditCard} label="Manage Billing" to="/account/billing" />
      </div>

      {eligibleForHotline && (
        <a
          href={tel(business.vipHotlinePhone!)}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-turquoise/30 bg-turquoise/10 p-4"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquoise/20 text-turquoise">
            <PhoneCall className="h-4.5 w-4.5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-navy">VIP Priority Hotline</span>
            <span className="block text-xs text-muted-foreground">{business.vipHotlinePhone}</span>
          </span>
        </a>
      )}

      <SectionLabel>App</SectionLabel>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow icon={Bell} label="Notifications" to="/notifications" />
        <NativeListRow icon={Settings2} label="Notification Settings" to="/account/notifications" />
        <NativeListRow icon={Sun} label="Prayer Settings" to="/account/prayer-settings" />
        <NativeListRow icon={Shield} label="Privacy & Security" to="/privacy-policy" />
        <NativeListRow icon={HelpCircle} label="Help & Support" to="/account/help" />
        <NativeListRow icon={Info} label="About Dr. Monzer Allan" to="/about" />
        <NativeListRow icon={FileText} label="Terms of Service" to="/terms" />
      </div>

      <SectionLabel>Data &amp; Privacy</SectionLabel>
      <div className="space-y-0.5 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow
          icon={Download}
          label="Download My Data"
          onClick={handleExport}
          right={
            exporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : undefined
          }
          chevron={!exporting}
        />
        <NativeListRow
          icon={Trash2}
          label="Delete Account"
          onClick={() => setDeleteSheetOpen(true)}
          danger
        />
      </div>

      <div className="mt-4 rounded-2xl bg-app-surface p-1.5">
        <NativeListRow
          icon={LogOut}
          label="Sign Out"
          onClick={() => signOut()}
          danger
          chevron={false}
        />
      </div>

      <NativeSheet
        open={deleteSheetOpen}
        onOpenChange={setDeleteSheetOpen}
        title="Delete your account?"
        description="This permanently removes your profile, meals, activity, and messages. This can't be undone."
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              An active paid membership isn&apos;t automatically cancelled by this — contact support
              first if you have one.
            </span>
          </div>
          {deleteError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleDeleteAccount}
            disabled={deleting}
            variant="destructive"
            className="w-full cursor-pointer justify-center"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Permanently Delete My Account"
            )}
          </Button>
        </div>
      </NativeSheet>
    </AppScreen>
  );
}
