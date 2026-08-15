import { supabase } from "@/lib/supabase";
import { getDemoMode, DEMO_CONVERSATION_ID } from "@/dev/demoMode";
import { DEMO_CONVERSATIONS, DEMO_MESSAGES } from "@/dev/demoFixtures";

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getOrCreateDirectConversation(
  otherUserId: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: true, conversationId: DEMO_CONVERSATION_ID };
  if (!supabase) return { ok: false, error: "Not connected." };
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user_id: otherUserId,
  });
  if (error) {
    if (error.message.includes("NOT_FRIENDS"))
      return { ok: false, error: "You can only message friends." };
    if (error.message.includes("BLOCKED"))
      return { ok: false, error: "Unable to message this user." };
    return { ok: false, error: "Could not start conversation." };
  }
  return { ok: true, conversationId: data as string };
}

export async function getMyConversations(): Promise<Conversation[]> {
  if (getDemoMode()) return DEMO_CONVERSATIONS;
  if (!supabase) return [];
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: participantRows, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);
  if (error || !participantRows || participantRows.length === 0) return [];

  const conversationIds = participantRows.map((p) => p.conversation_id);

  const { data: otherParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  const otherUserIds = [...new Set((otherParticipants ?? []).map((p) => p.user_id))];
  const { data: profiles } = otherUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", otherUserIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const otherByConversation = new Map(
    (otherParticipants ?? []).map((p) => [p.conversation_id, p.user_id]),
  );

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastByConversation = new Map<
    string,
    { content: string; created_at: string; sender_id: string }
  >();
  for (const m of recentMessages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) lastByConversation.set(m.conversation_id, m);
  }

  const lastReadByConversation = new Map(
    participantRows.map((p) => [p.conversation_id, p.last_read_at]),
  );

  return conversationIds
    .map((id) => {
      const last = lastByConversation.get(id);
      const lastRead = lastReadByConversation.get(id);
      const otherId = otherByConversation.get(id);
      return {
        id,
        otherUser: otherId ? (profileById.get(otherId) ?? null) : null,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.created_at ?? null,
        unread: Boolean(
          last &&
          last.sender_id !== userId &&
          (!lastRead || new Date(last.created_at) > new Date(lastRead)),
        ),
      };
    })
    .sort(
      (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
    );
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (getDemoMode()) return DEMO_MESSAGES;
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return [];
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // DEV-ONLY demo preview — accepted as sent but not persisted or echoed
  // back via realtime (subscribeToConversation() is also a no-op below),
  // so the demo conversation intentionally stays static rather than fake
  // a live chat.
  if (getDemoMode()) return { ok: true };
  if (!supabase) return { ok: false, error: "Not connected." };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Message can't be empty." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: trimmed.slice(0, 2000),
  });
  if (error) return { ok: false, error: "Could not send message." };
  return { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Message) => void,
) {
  if (getDemoMode() || !supabase) return () => {};
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
