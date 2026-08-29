import { useContext } from "react";

import { LocaleContext, type LocaleContextValue } from "./context";
import type { TranslateFn } from "./translate";

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Convenience for the common case — `const t = useTranslate()`. */
export function useTranslate(): TranslateFn {
  return useLocale().t;
}
