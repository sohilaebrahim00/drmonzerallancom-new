import { createContext } from "react";

import type { Locale } from "./config";
import type { TranslateFn } from "./translate";
import type { formatPrice } from "./format";

export interface LocaleContextValue {
  locale: Locale;
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
