import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";

import { isNativePlatform } from "@/hooks/use-native-platform";

const ROOT_TAB_PATHS = new Set(["/", "/health", "/ai", "/consultations", "/account"]);

/**
 * Maps the Android hardware/gesture back button onto sane in-app behavior:
 * on a sub-page, go back one step; on one of the bottom-nav root tabs,
 * return to Home; on Home itself, exit the app rather than getting stuck.
 * No-op on web/iOS — iOS has no hardware back button and this listener
 * simply never fires there.
 */
export function NativeBackHandler() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (!ROOT_TAB_PATHS.has(pathname)) {
        navigate(-1);
      } else if (pathname !== "/") {
        navigate("/");
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate, pathname]);

  return null;
}
