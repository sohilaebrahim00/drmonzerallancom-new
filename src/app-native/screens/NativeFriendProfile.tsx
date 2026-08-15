import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Flag, CircleNotch, ChatCircleDots, ShieldSlash, UserMinus } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { NativeSheet } from "@/app-native/components/NativeSheet";
import { getPublicProfile, type PublicProfileSummary } from "@/services/profileService";
import {
  blockUser,
  getMyFriends,
  removeFriendship,
  type FriendshipRow,
} from "@/services/friendsService";
import { getOrCreateDirectConversation } from "@/services/messagingService";
import { reportUser, type ReportReason } from "@/services/reportService";
import { supabase } from "@/lib/supabase";
import { getDemoMode, DEMO_FRIEND_AHMED_ID } from "@/dev/demoMode";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

interface SharedToday {
  calories: number | null;
  steps: number | null;
  activityCalories: number | null;
}

export default function NativeFriendProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileSummary | null>(null);
  const [friendship, setFriendship] = useState<FriendshipRow | null>(null);
  const [today, setToday] = useState<SharedToday | null>(null);
  const [blockSheetOpen, setBlockSheetOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getPublicProfile(userId), getMyFriends()]).then(([p, friends]) => {
      setProfile(p);
      setFriendship(friends.find((f) => f.other?.id === userId) ?? null);
      setLoading(false);
    });

    if (getDemoMode()) {
      // DEV-ONLY demo preview — Ahmed shares a plausible "today" snapshot;
      // Mona (who hasn't opted to share) shows nothing, matching the
      // privacy-by-category rule the real query already enforces via RLS.
      setToday(
        userId === DEMO_FRIEND_AHMED_ID
          ? { calories: 1680, steps: 9200, activityCalories: 210 }
          : { calories: null, steps: null, activityCalories: null },
      );
      return;
    }

    if (supabase) {
      const dateStr = new Date().toISOString().slice(0, 10);
      Promise.all([
        supabase
          .from("meal_logs")
          .select("total_calories")
          .eq("user_id", userId)
          .eq("shared_with_friends", true)
          .gte("meal_time", `${dateStr}T00:00:00Z`),
        supabase
          .from("step_logs")
          .select("steps")
          .eq("user_id", userId)
          .eq("date", dateStr)
          .maybeSingle(),
        supabase
          .from("activity_logs")
          .select("estimated_calories_burned")
          .eq("user_id", userId)
          .eq("shared_with_friends", true)
          .gte("completed_at", `${dateStr}T00:00:00Z`),
      ]).then(([meals, steps, activities]) => {
        setToday({
          calories: meals.data ? meals.data.reduce((s, m) => s + m.total_calories, 0) : null,
          steps: steps.data?.steps ?? null,
          activityCalories: activities.data
            ? activities.data.reduce((s, a) => s + (a.estimated_calories_burned ?? 0), 0)
            : null,
        });
      });
    }
  }, [userId]);

  async function handleMessage() {
    if (!userId) return;
    const result = await getOrCreateDirectConversation(userId);
    if (result.ok) navigate(`/social/messages/${result.conversationId}`);
  }

  async function handleRemove() {
    if (!friendship) return;
    await removeFriendship(friendship.id);
    navigate("/social", { replace: true });
  }

  async function handleBlock() {
    if (!userId || blocking) return;
    setBlocking(true);
    const outcome = await blockUser(userId);
    setBlocking(false);
    if (outcome.ok) navigate("/social", { replace: true });
  }

  async function handleReport() {
    if (!userId) return;
    const outcome = await reportUser(userId, reportReason);
    if (outcome.ok) setReportSubmitted(true);
  }

  if (loading) {
    return (
      <AppScreen title="Profile" back className="flex min-h-[50vh] items-center justify-center">
        <CircleNotch className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  if (!profile) {
    return (
      <AppScreen title="Profile" back className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={`@${profile.username ?? "member"}`}
      back
      className="mx-auto w-full max-w-lg px-4 pb-8 pt-3"
    >
      <div className="flex flex-col items-center text-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary">
            {(profile.full_name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <p className="mt-3 font-display text-lg font-bold text-navy">
          {profile.full_name ?? "Member"}
        </p>
        <p className="text-xs text-muted-foreground">@{profile.username}</p>
      </div>

      {friendship?.status === "accepted" && (
        <div className="mt-6 flex gap-2.5">
          <Button onClick={handleMessage} className="flex-1 cursor-pointer">
            <ChatCircleDots className="h-4 w-4" /> Message
          </Button>
          <Button onClick={handleRemove} variant="outline" className="flex-1 cursor-pointer">
            <UserMinus className="h-4 w-4" /> Remove
          </Button>
        </div>
      )}

      {friendship?.status === "accepted" && today && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Today
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-border/70 bg-card p-3 text-center shadow-sm">
              <p className="font-display text-base font-bold text-navy">
                {today.calories != null ? Math.round(today.calories) : "—"}
              </p>
              <p className="text-[0.65rem] text-muted-foreground">Calories</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 text-center shadow-sm">
              <p className="font-display text-base font-bold text-navy">{today.steps ?? "—"}</p>
              <p className="text-[0.65rem] text-muted-foreground">Steps</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 text-center shadow-sm">
              <p className="font-display text-base font-bold text-navy">
                {today.activityCalories != null ? Math.round(today.activityCalories) : "—"}
              </p>
              <p className="text-[0.65rem] text-muted-foreground">Activity</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
            Only what @{profile.username} has chosen to share is shown.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => setBlockSheetOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-destructive"
        >
          <ShieldSlash className="h-3.5 w-3.5" /> Block
        </button>
        <button
          type="button"
          onClick={() => setReportSheetOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
        >
          <Flag className="h-3.5 w-3.5" /> Report
        </button>
      </div>

      <NativeSheet
        open={blockSheetOpen}
        onOpenChange={setBlockSheetOpen}
        title={`Block @${profile.username}?`}
        description="They won't be able to message you, send a friend request, or see anything you share with friends."
      >
        <Button
          onClick={handleBlock}
          disabled={blocking}
          variant="destructive"
          className="w-full cursor-pointer justify-center"
        >
          {blocking ? <CircleNotch className="h-4 w-4 animate-spin" /> : "Block User"}
        </Button>
      </NativeSheet>

      <NativeSheet
        open={reportSheetOpen}
        onOpenChange={(open) => {
          setReportSheetOpen(open);
          if (!open) setReportSubmitted(false);
        }}
        title="Report this user"
      >
        {reportSubmitted ? (
          <p className="py-2 text-sm text-muted-foreground">
            Thanks — this has been reported for review.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReportReason(r.value)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${reportReason === r.value ? "border-primary bg-secondary/60 text-primary" : "border-border text-navy/70"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button onClick={handleReport} className="w-full cursor-pointer justify-center">
              Submit Report
            </Button>
          </div>
        )}
      </NativeSheet>
    </AppScreen>
  );
}
