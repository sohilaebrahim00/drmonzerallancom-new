import { createContext } from "react";

import type { Locale } from "./config";
import type { TranslateFn } from "./translate";
import type { formatPrice } from "./format";

export interface LocaleContextValue {
  /**
   * The locale the page is RENDERED in. On an English-only route this is "en"
   * even for a reader who chose Arabic — see englishOnlyRoutes.ts.
   */
  locale: Locale;
  /**
   * The locale the reader ASKED FOR, which is what is stored and what the
   * language switch must show as selected. Without this, visiting the account
   * area would make the control read "English" and the preference would look
   * like it had reset — which is the bug, not the display of it.
   */
  requestedLocale: Locale;
  /** True where the route forces English regardless of the preference. */
  localeForcedEnglish: boolean;
  dir: "ltr" | "rtl";
  setLocale: (next: Locale) => void;
  t: TranslateFn;
  /** Bound to the active locale so components never pass it by hand. */
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Locale-independent by decision — see format.ts. */
  formatPrice: typeof formatPrice;
}

/**
 * The context lives in its own module, apart from both the provider component
 * and the hooks, so that each file exports one kind of thing. React Fast
 * Refresh needs a component file to export only components, and the repo's
 * lint gate treats a new `react-refresh/only-export-components` warning as a
 * failure.
 */
export const LocaleContext = createContext<LocaleContextValue | null>(null);
