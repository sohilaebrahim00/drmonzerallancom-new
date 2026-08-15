import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";
import { DEMO_FRIENDS } from "@/dev/demoFixtures";

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  other: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function listByStatus(
  status: FriendshipStatus | FriendshipStatus[],
): Promise<FriendshipRow[]> {
  if (getDemoMode()) {
    const statuses = Array.isArray(status) ? status : [status];
    return statuses.includes("accepted") ? DEMO_FRIENDS : [];
  }
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];

  const statuses = Array.isArray(status) ? status : [status];
  const { data, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .in("status", statuses)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const otherIds = data.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );
  if (otherIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", otherIds);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((row) => ({
    ...row,
    other: byId.get(row.requester_id === userId ? row.addressee_id : row.requester_id) ?? null,
  })) as FriendshipRow[];
}

export function getMyFriends(): Promise<FriendshipRow[]> {
  return listByStatus("accepted");
}

/** Requests sent TO me, awaiting my response. */
export async function getIncomingRequests(): Promise<FriendshipRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const all = await listByStatus("pending");
  return all.filter((r) => r.addressee_id === userId);
}

/** Requests I've sent, awaiting their response. */
export async function getSentRequests(): Promise<FriendshipRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const all = await listByStatus("pending");
  return all.filter((r) => r.requester_id === userId);
}

export type FriendActionResult = { ok: true } | { ok: false; error: string };

function mapFriendError(message: string): string {
  if (message.includes("ALREADY_CONNECTED"))
    return "You're already connected or have a pending request.";
  if (message.includes("CANNOT_FRIEND_SELF")) return "You can't send yourself a friend request.";
  return "Something went wrong. Please try again.";
}

export async function sendFriendRequest(addresseeId: string): Promise<FriendActionResult> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("send_friend_request", { p_addressee_id: addresseeId });
  if (error) return { ok: false, error: mapFriendError(error.message) };
  return { ok: true };
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
): Promise<FriendActionResult> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("respond_friend_request", {
    p_friendship_id: friendshipId,
    p_accept: accept,
  });
  if (error) return { ok: false, error: mapFriendError(error.message) };
  return { ok: true };
}

export async function removeFriendship(friendshipId: string): Promise<FriendActionResult> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("cancel_or_remove_friendship", {
    p_friendship_id: friendshipId,
  });
  if (error) return { ok: false, error: mapFriendError(error.message) };
  return { ok: true };
}

export async function blockUser(targetUserId: string): Promise<FriendActionResult> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("block_user", { p_target_id: targetUserId });
  if (error) return { ok: false, error: mapFriendError(error.message) };
  return { ok: true };
}

export async function unblockUser(targetUserId: string): Promise<FriendActionResult> {
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { error } = await supabase.rpc("unblock_user", { p_target_id: targetUserId });
  if (error) return { ok: false, error: "Could not unblock. Please try again." };
  return { ok: true };
}

/** Only people I placed the block on — never reveals if someone else blocked me. */
export async function getBlockedUsers(): Promise<FriendshipRow[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .eq("status", "blocked")
    .eq("blocked_by", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const otherIds = data.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );
  if (otherIds.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", otherIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((row) => ({
    ...row,
    other: byId.get(row.requester_id === userId ? row.addressee_id : row.requester_id) ?? null,
  })) as FriendshipRow[];
}
