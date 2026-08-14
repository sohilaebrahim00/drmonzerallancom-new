import type { CapacitorConfig } from "@capacitor/cli";

// App ID is provisional — must be finalized (and locked) before any App Store / Google Play
// submission, since changing it after publishing requires a new store listing.
const config: CapacitorConfig = {
  appId: "com.monzerallan.app",
  appName: "Monzer Allan",
  webDir: "dist",
  backgroundColor: "#fcfdfd",
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: "#fcfdfd",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // "LIGHT" = dark status bar text/icons, correct for this app's light background.
      style: "LIGHT",
      backgroundColor: "#fcfdfd",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
