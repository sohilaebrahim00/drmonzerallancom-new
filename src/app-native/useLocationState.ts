import { useLocation } from "react-router-dom";

/** Reads one key off `location.state`, typed — used for screen-to-screen handoffs (scan result, AI prefill). */
export function useLocationState<T>(key: string): T | undefined {
  const location = useLocation();
  const state = location.state as Record<string, unknown> | null;
  return state?.[key] as T | undefined;
}
