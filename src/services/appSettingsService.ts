import { Preferences } from "@capacitor/preferences";

/**
 * Generic typed local-preference store. `@capacitor/preferences` ships a web
 * implementation backed by localStorage, so this works identically on
 * website and native without branching — used for on-device-only settings
 * (prayer calculation prefs, reminder toggles, food-scan save choice) that
 * never need to sync to Supabase.
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export async function removeSetting(key: string): Promise<void> {
  await Preferences.remove({ key });
}
