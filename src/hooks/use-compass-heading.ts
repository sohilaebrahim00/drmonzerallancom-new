import { useCallback, useEffect, useRef, useState } from "react";

export type CompassPermissionState = "not-required" | "needs-request" | "granted" | "denied";

interface IOSDeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

function headingFromEvent(event: CompassOrientationEvent): number | null {
  // iOS (WKWebView/Safari): webkitCompassHeading is already a true compass
  // heading (0 = north), no conversion needed.
  if (typeof event.webkitCompassHeading === "number") return event.webkitCompassHeading;
  // Android: `alpha` on an *absolute* event is degrees counter-clockwise
  // from north — invert to get a standard clockwise-from-north heading.
  if (event.absolute && typeof event.alpha === "number") return (360 - event.alpha) % 360;
  return null;
}

/**
 * Standards-based device compass heading (no extra native plugin — Capacitor
 * ships no maintained compass plugin, and the web DeviceOrientationEvent API
 * already works inside both the Android WebView and iOS WKWebView).
 * `supported` flips to false if no usable orientation event arrives within a
 * few seconds, so callers can fall back to a manual-alignment instruction.
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<CompassPermissionState>("not-required");
  const receivedRef = useRef(false);

  const attach = useCallback(() => {
    function onOrientation(event: Event) {
      const value = headingFromEvent(event as CompassOrientationEvent);
      if (value !== null) {
        receivedRef.current = true;
        setHeading(value);
      }
    }
    const eventName =
      "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, onOrientation);
    const timeout = setTimeout(() => {
      if (!receivedRef.current) setSupported(false);
    }, 2500);
    return () => {
      window.removeEventListener(eventName, onOrientation);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
      setSupported(false);
      return;
    }
    const iosRequestFn = (DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent)
      .requestPermission;
    if (typeof iosRequestFn === "function") {
      // iOS requires an explicit user-gesture-triggered request — wait for it.
      setPermissionState("needs-request");
      return;
    }
    return attach();
  }, [attach]);

  const requestPermission = useCallback(async () => {
    const iosRequestFn = (DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent)
      .requestPermission;
    if (typeof iosRequestFn !== "function") return;
    try {
      const result = await iosRequestFn();
      if (result === "granted") {
        setPermissionState("granted");
        attach();
      } else {
        setPermissionState("denied");
      }
    } catch {
      setPermissionState("denied");
    }
  }, [attach]);

  return { heading, supported, permissionState, requestPermission };
}
