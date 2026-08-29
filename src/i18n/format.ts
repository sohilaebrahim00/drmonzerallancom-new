import { intlTagOf, type Locale } from "./config";

/**
 * Every date, time and number the visitor reads goes through here.
 *
 * The rule this file exists to enforce: `Intl` is never constructed inline in a
 * component with a hardcoded locale. Thirteen call sites did exactly that
 * (`new Intl.DateTimeFormat("en-US", ...)`), which is invisible until the site
 * is Arabic and every appointment still reads "Friday, August 28".
 *
 * NOT in scope here, and they must stay `en-US`:
 *   supabase/functions/_shared/availability.ts  getTimeZoneOffsetMinutes()
 *   supabase/functions/admin-availability/index.ts  isValidTimeZone()
 * Those parse `formatToParts` output back into numbers, or probe a timezone
 * for validity. They are arithmetic wearing a formatter's clothes; localising
 * them would break slot generation, not translate it.
 */

type FormatterCache<T> = Map<string, T>;

const dateFormatters: FormatterCache<Intl.DateTimeFormat> = new Map();
const numberFormatters: FormatterCache<Intl.NumberFormat> = new Map();

function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = locale + "|" + JSON.stringify(options);
  let f = dateFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(intlTagOf(locale), options);
    dateFormatters.set(key, f);
  }
  return f;
}

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions) {
  const key = locale + "|" + JSON.stringify(options);
  let f = numberFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(intlTagOf(locale), options);
    numberFormatters.set(key, f);
  }
  return f;
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter(locale, options).format(date);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(locale, options).format(value);
}

/**
 * Prices stay in `en-US`, in BOTH languages. This is the one place the active
 * locale is deliberately ignored, so the reasoning is here rather than spread
 * across the price components:
 *
 *   new Intl.NumberFormat("ar-u-nu-latn", {currency:"USD"}).format(499)
 *     -> "\u200F499 US$"   (RLM, non-breaking space, and "US$" not "$")
 *   new Intl.NumberFormat("en-US",        {currency:"USD"}).format(499)
 *     -> "$499"
 *
 * Latin digits were chosen so a USD price does not read as a mistake. CLDR's
 * Arabic form defeats that in the other half of the string: it renders the
 * symbol as "US$" and prefixes an invisible direction mark that shows up when
 * the price is pasted into WhatsApp or an invoice. Since the amounts are USD
 * and the doctor's own materials print "$499", the whole price token is pinned
 * to English rather than half-localised.
 *
 * This is a currency-formatting decision only. Dates, times and plain numbers
 * do follow the locale.
 */
export function formatPrice(amount: number, currency: "USD" = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
