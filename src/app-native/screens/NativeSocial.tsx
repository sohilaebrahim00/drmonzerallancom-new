import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Search, Sparkles, UserPlus, Users } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  getIncomingRequests,
  getMyFriends,
  getSentRequests,
  respondToFriendRequest,
  sendFriendRequest,
  type FriendshipRow,
} from "@/services/friendsService";
import { searchUsers, type PublicProfileSummary } from "@/services/profileService";
import { getMyConversations, type Conversation } from "@/services/messagingService";
import { getFriendsActivityFeed, type FeedEvent } from "@/services/socialFeedService";

type Tab = "activity" | "friends" | "requests" | "find" | "messages";

function Avatar({ name, url }: { name?: string | null; url?: string | null }) {
  if (url) return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function NativeSocial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("activity");
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [friends, setFriends] = useState<FriendshipRow[]>([]);
  const [incoming, setIncoming] = useState<FriendshipRow[]>([]);
  const [sent, setSent] = useState<FriendshipRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProfileSummary[]>([]);
  const [searching, setSearching] = useState(false);

  function refresh() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getFriendsActivityFeed(),
      getMyFriends(),
      getIncomingRequests(),
      getSentRequests(),
      getMyConversations(),
    ]).then(([activity, f, inc, s, convos]) => {
      setFeed(activity);
      setFriends(f);
      setIncoming(inc);
      setSent(s);
      setConversations(convos);
      setLoading(false);
    });
  }

  useEffect(refresh, [user]);

  useEffect(() => {
    if (tab !== "find" || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(query).then((results) => {
        setSearchResults(results);
        setSearching(false);
      });
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, tab]);

  if (!user) {
    return (
      <AppScreen title="Social" tabBar className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Sign in to connect with friends.</p>
      </AppScreen>
    );
  }

  const sentIds = new Set(sent.map((s) => s.other?.id));
  const friendIds = new Set(friends.map((f) => f.other?.id));

  const TABS: { value: Tab; label: string }[] = [
    { value: "activity", label: "Activity" },
    { value: "friends", label: "Friends" },
    { value: "requests", label: "Requests" },
    { value: "messages", label: "Messages" },
  ];

  return (
    <AppScreen title="Social" tabBar className="mx-auto w-full max-w-lg px-4 pb-6 pt-3">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTab("find");
          }}
          placeholder="Find people by username"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "cursor-pointer rounded-xl px-1 py-2 text-xs font-semibold transition-colors",
              tab === t.value
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-app-surface-secondary",
            )}
          >
            {t.label}
            {t.value === "requests" && incoming.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[0.6rem] text-primary-foreground">
                {incoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-4">
          {tab === "activity" && (
            <>
              {feed.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No activity yet"
                  body="When friends share a meal or activity, it will show up here."
                />
              ) : (
                <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                  {feed.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 py-3">
                      <Avatar
                        name={event.user?.full_name ?? event.user?.username}
                        url={event.user?.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-navy">
                          <span className="font-semibold">{event.user?.full_name ?? "Member"}</span>{" "}
                          {event.summary.toLowerCase()}
                        </p>
                        {event.detail && (
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                        {timeAgo(event.at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "friends" && (
            <>
              {friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No friends yet"
                  body="Search for people by username to connect."
                  action={
                    <button
                      type="button"
                      onClick={() => setTab("find")}
                      className="text-xs font-semibold text-primary"
                    >
                      Find People
                    </button>
                  }
                />
              ) : (
                <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => navigate(`/social/profile/${f.other?.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <Avatar
                        name={f.other?.full_name ?? f.other?.username}
                        url={f.other?.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">
                          {f.other?.full_name ?? "Member"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{f.other?.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "requests" && (
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Incoming
                </p>
                {incoming.length === 0 ? (
                  <p className="px-1 text-sm text-muted-foreground">No pending requests.</p>
                ) : (
                  <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                    {incoming.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 py-3">
                        <Avatar
                          name={r.other?.full_name ?? r.other?.username}
                          url={r.other?.avatar_url}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-navy">
                            {r.other?.full_name ?? "Member"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{r.other?.username}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => respondToFriendRequest(r.id, true).then(refresh)}
                            className="cursor-pointer rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToFriendRequest(r.id, false).then(refresh)}
                            className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-navy"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1.5 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Sent
                </p>
                {sent.length === 0 ? (
                  <p className="px-1 text-sm text-muted-foreground">No pending sent requests.</p>
                ) : (
                  <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                    {sent.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 py-3">
                        <Avatar
                          name={r.other?.full_name ?? r.other?.username}
                          url={r.other?.avatar_url}
                        />
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
                          {r.other?.full_name ?? "Member"}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "find" && (
            <div className="space-y-2">
              {searching && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
              {!searching && query.trim().length >= 2 && searchResults.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">
                  No one found for &quot;{query}&quot;.
                </p>
              )}
              {searchResults.length > 0 && (
                <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                  {searchResults.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-3">
                      <Avatar name={r.full_name ?? r.username} url={r.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">
                          {r.full_name ?? "Member"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{r.username}</p>
                      </div>
                      {friendIds.has(r.id) ? (
                        <span className="shrink-0 text-xs text-muted-foreground">Friends</span>
                      ) : sentIds.has(r.id) ? (
                        <span className="shrink-0 text-xs text-muted-foreground">Requested</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendFriendRequest(r.id).then(refresh)}
                          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "messages" && (
            <>
              {conversations.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No messages yet"
                  body="Message a friend from their profile to start a conversation."
                />
              ) : (
                <div className="divide-y divide-border/50 rounded-2xl bg-app-surface px-3">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/social/messages/${c.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <Avatar
                        name={c.otherUser?.full_name ?? c.otherUser?.username}
                        url={c.otherUser?.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">
                          {c.otherUser?.full_name ?? "Member"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.lastMessage ?? "Say hello"}
                        </p>
                      </div>
                      {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AppScreen>
  );
}
