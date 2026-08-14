import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";

import { isNativePlatform } from "@/hooks/use-native-platform";

/** monzerallan://<key> → in-app route. Keep in sync with AndroidManifest.xml's scheme filter. */
const CUSTOM_SCHEME_ROUTES: Record<string, string> = {
  account: "/account",
  consultations: "/consultations",
  membership: "/consultations",
  "food-scanner": "/food-scanner",
  "prayer-times": "/prayer-times",
  qibla: "/qibla",
  health: "/health",
  ai: "/ai",
  products: "/products",
  blog: "/blog",
};

/**
 * The website and the native app use different route shapes for the same
 * concepts (e.g. web's /account/consultations vs. native's /consultations) —
 * a universal link's pathname can't just be passed straight through.
 */
function mapWebsitePathToNative(pathname: string): string {
  if (pathname.startsWith("/account/consultations")) return "/consultations";
  if (pathname.startsWith("/account")) return "/account";
  if (pathname.startsWith("/packages") || pathname.startsWith("/join")) return "/consultations";
  if (pathname.startsWith("/products")) return pathname;
  if (pathname.startsWith("/blog")) return pathname;
  if (pathname.startsWith("/gallery") || pathname.startsWith("/videos")) return "/videos";
  return "/";
}

function resolvePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "monzerallan:") {
      const key = (parsed.hostname || parsed.pathname.replace(/^\/+/, "")).toLowerCase();
      return CUSTOM_SCHEME_ROUTES[key] ?? "/";
    }
    if (parsed.protocol === "https:" && parsed.hostname === "monzerallan.com") {
      return mapWebsitePathToNative(parsed.pathname);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Handles both custom-scheme deep links (monzerallan://...) and universal/App
 * Links (https://monzerallan.com/...) opened while the app is already
 * running or used to cold-start it, routing them into React Router instead
 * of leaving the WebView on its default page. No-op on web.
 */
export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", (data) => {
      const path = resolvePath(data.url);
      if (path) navigate(path);
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate]);

  return null;
}
