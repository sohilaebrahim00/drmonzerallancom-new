import { Languages } from "lucide-react";

import { useLocale } from "@/i18n";
import { createTranslator } from "@/i18n/translate";
import { dirOf } from "@/i18n/config";

/**
 * Tells an Arabic reader, in Arabic, that this section is English.
 *
 * WITHOUT THIS the flip reads as the language switch being broken: the reader
 * chose Arabic, the header still shows Arabic selected, and the page in front
 * of them is English. One line turns that from a fault into a stated state.
 *
 * It renders NOTHING for a reader who did not ask for Arabic — an English
 * visitor does not need to be told the English page is in English.
 *
 * The notice is translated with the REQUESTED locale, deliberately. The
 * surrounding page is forced to English, so the ambient `t` would render this
 * sentence in English too — a notice explaining in English that the page is in
 * English, which helps nobody. It is also marked `dir` and `lang` for itself,
 * because it is the one right-to-left island on a left-to-right page.
 */
export function EnglishOnlyNotice() {
  const { requestedLocale, localeForcedEnglish } = useLocale();
  if (!localeForcedEnglish) return null;

  const translate = createTranslator(requestedLocale);

  return (
    <div
      dir={dirOf(requestedLocale)}
      lang={requestedLocale}
      className="mb-6 flex items-start gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground"
    >
      <Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="m-0">{translate("account.englishOnlyNotice")}</p>
    </div>
  );
}
