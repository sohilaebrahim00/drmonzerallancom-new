import { lazy, Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

// vaul (the Drawer's underlying gesture/animation library) is only ever
// needed on mobile — importing it here, and importing this whole module
// lazily from ChatWidget, keeps it out of the desktop/eager bundle entirely.
const ChatBody = lazy(() => import("./ChatBody"));

function ChatBodyFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function MobileChatDrawer({
  open,
  onOpenChange,
  launcher,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  launcher: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{launcher}</DrawerTrigger>
      <DrawerContent className="h-[85vh] border-white/40 bg-card/95 p-0 backdrop-blur-xl">
        <Suspense fallback={<ChatBodyFallback />}>
          <ChatBody onClose={() => onOpenChange(false)} />
        </Suspense>
      </DrawerContent>
    </Drawer>
  );
}
