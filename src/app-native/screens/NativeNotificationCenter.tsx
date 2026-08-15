import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CircleNotch, ChatCircleDots, UserPlus } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { getIncomingRequests, type FriendshipRow } from "@/services/friendsService";
import { getMyConversations, type Conversation } from "@/services/messagingService";
import { getMyPendingActivityTasks, type ActivityTask } from "@/services/activityService";

/**
 * A real in-app notification center — not a second event log, an
 * aggregation view over data that already exists (friend requests, unread
 * conversations, ready activity tasks). No new table: every row here is
 * derived from the same RLS-protected queries the Social/Home screens
 * already use, just presented as one combined, actionable list.
 */
export default function NativeNotificationCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FriendshipRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [readyTask, setReadyTask] = useState<ActivityTask | null>(null);

  useEffect(() => {
    Promise.all([getIncomingRequests(), getMyConversations(), getMyPendingActivityTasks()]).then(
      ([reqs, convos, tasks]) => {
        setRequests(reqs);
        setConversations(convos.filter((c) => c.unread));
        const ready = tasks.find((t) => new Date(t.available_at) <= new Date());
        setReadyTask(ready ?? null);
        setLoading(false);
      },
    );
  }, []);

  const hasAny = requests.length > 0 || conversations.length > 0 || readyTask;

  return (
    <AppScreen title="Notifications" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      {loading ? (
        <div className="flex justify-center py-10">
          <CircleNotch className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !hasAny ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          body="New friend requests, messages, and tasks will show up here."
        />
      ) : (
        <div className="space-y-2">
          {readyTask && (
            <button
              type="button"
              onClick={() => navigate("/activity-task")}
              className="flex w-full items-center gap-3 rounded-xl border border-turquoise/30 bg-turquoise/10 p-3.5 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turquoise/20 text-turquoise">
                <Bell className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy">Movement suggestion ready</span>
                <span className="block text-xs text-muted-foreground">Tap to view</span>
              </span>
            </button>
          )}
          {requests.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate("/social")}
              className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3.5 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <UserPlus className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy">
                  {r.other?.full_name ?? "Someone"} sent a friend request
                </span>
                <span className="block text-xs text-muted-foreground">@{r.other?.username}</span>
              </span>
            </button>
          ))}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/social/messages/${c.id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-app-surface p-3.5 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <ChatCircleDots className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-navy">
                  New message from {c.otherUser?.full_name ?? "a friend"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.lastMessage}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </AppScreen>
  );
}
