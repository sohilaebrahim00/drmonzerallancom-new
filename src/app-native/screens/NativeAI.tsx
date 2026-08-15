import { Suspense, lazy } from "react";
import { CircleNotch } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { useLocationState } from "@/app-native/useLocationState";

const ChatBody = lazy(() => import("@/components/chat/ChatBody"));

function ChatFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <CircleNotch className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/**
 * Full-screen AI Concierge — the native app's primary way to reach the
 * assistant (the web-only floating widget doesn't exist here). Reuses the
 * exact same ChatBody component and ai-chat Edge Function as the website —
 * no second chatbot engine.
 */
export default function NativeAI() {
  const prefillMessage = useLocationState<string>("prefillMessage");

  return (
    <AppScreen tabBar scroll={false} hideHeader>
      <div className="native-safe-top flex h-full min-h-0 flex-col">
        <Suspense fallback={<ChatFallback />}>
          <ChatBody initialMessage={prefillMessage} />
        </Suspense>
      </div>
    </AppScreen>
  );
}
