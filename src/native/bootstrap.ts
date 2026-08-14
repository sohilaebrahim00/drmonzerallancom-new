import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

/**
 * Runs once, only inside the native Android/iOS wrapper (never on web).
 * Configures the status bar to match the app's light background, then hides
 * the splash screen once React has mounted — the config-driven
 * `launchShowDuration` already keeps the splash brief, this just ensures we
 * never hold it past first paint.
 */
export async function bootstrapNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#fcfdfd" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // StatusBar.setBackgroundColor/setOverlaysWebView are Android-only and
    // reject on iOS by design — the style call above still applies there.
  }

  try {
    // Edge-to-edge on Android pushes the keyboard up instead of resizing the
    // whole webview by default on some OEM skins; force resize so fixed
    // bottom nav + inputs stay reachable above the keyboard.
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch {
    // Not fatal — keyboard-safe layout still degrades gracefully via CSS.
  }

  await SplashScreen.hide();
}
