# PHASE 8B — the Arabic itself

Apply the GROUND RULES from `FIX_PLAN.md` (no faking, no refactoring outside these items, the four
gate commands, no secrets, DONE/NOT DONE table).

**Deviation from one-commit, deliberately authorised: one commit per group below.** Twenty pages of
translation in a single commit is unreviewable, and the legal group must be separable from the
rest. Run the gates and commit at the end of each group.

---

## Already done — do not redo, do not undo

- The mechanism: typed context, `Intl.PluralRules`, `ar-u-nu-latn` dates and numbers, English
  fallback, `localStorage`, `lang` + `dir` on `<html>`
- 50 physical→logical Tailwind utilities across 27 files; 16 mirrored directional icons
- Self-hosted IBM Plex Sans Arabic, Arabic `unicode-range`, 0 KiB precache cost
- The language switch, built and **gated off** in `src/config/features.ts`
- 34 dictionary keys: global nav, header, footer, shared CTAs
- The compare slider mirrors its layout, never its pixels
- Deploy-order block in `FIX_PLAN.md`

Two exclusions stay excluded: the `left-1/2` + `-translate-x-1/2` centring idiom, and
`src/components/ui/*`.

---

## Binding constraints for every group

**1. `dir="auto"` on text-bearing leaves only.** `<h1>`–`<h3>`, `<p>`, `<li>`, `<td>`, `<label>`,
`<figcaption>`. **Never on a flex or grid wrapper** — `dir` sets direction for children, so on a
layout container it reorders the layout from whatever its first strong character happens to be,
turning a punctuation bug into a layout bug. The page-level `dir` stays the authority for layout.

**2. `<bdi>` at real interpolations only.** `dir="auto"` reads the first strong character of the
whole element, so an Arabic sentence containing `$119`, `Google Meet` or an email address still
mis-orders the neutrals around that run. Wrap the interpolated value. Do this where an
interpolation actually exists — not preemptively across the dictionaries — and list every one.

**3. Keys by meaning, never by English text.** `packages.treatmentBasic.cta`, not
`"Start Your Program"`.

**4. Key sets stay identical.** Verify `en` and `ar` after every group: 0 missing, 0 extra.

**5. The switch stays gated off** for the whole of this phase. It is flipped by a separate,
one-line commit after the review in 8B.5 — not by you, and not as part of a translation commit.

---

## Translation standard

Modern Standard Arabic that a Levantine or Gulf patient reads as **natural**, not a word-for-word
rendering of the English. Marketing copy translated literally reads like a machine, and this is a
doctor's professional site.

**Flag, by key, every string you are not confident in.** Do not quietly guess. A flagged string is
cheap; a wrong one on a medical site is not.

**Medical and legal text is translated conservatively.** It must not become softer, stronger, or
vaguer in Arabic than in English. Where unsure, stay literal and flag it.

Numbers and prices keep Latin digits (`ar-u-nu-latn`). Do not convert `$119` to Arabic-Indic
numerals.

---

## The groups, in this order

### 8B.1 — Marketing pages
Home sections, About, Packages, FAQ, Contact, Products, Blog index, Gallery, Videos.
Page furniture only — **not** the doctor's article bodies or FAQ answer content, which are his to
write. Translate headings, labels, buttons, empty states, error messages.

### 8B.2 — Patient screens
Login, Forgot password, Reset password, Account, Account Consultations, Account Intake, My
Program, Membership success / cancelled, 404.

These carry error and status messages a patient reads at a bad moment — locked out, payment
failed, consultation cancelled. Translate those with particular care: they must say what happened
and what to do next, exactly as the English does.

### 8B.3 — Legal and medical, its own commit

**SCOPE CUT, 30 August. The legal pages are NOT translated.**

Privacy, Terms and the Medical Disclaimer stay **English only**. A translated legal document
creates ambiguity about which version governs in a dispute, which is why many companies keep one
authoritative language on purpose. Translating them would create a liability, not remove one.

What to build instead, on each of the three pages:

- A short **Arabic notice at the top** stating that the English version is the authoritative one,
  with a link to it. That line IS translated.
- The **navigation to reach the pages** is translated (the footer links already are).
- **Nothing else on those pages.** Do not translate the body, the headings, or the section titles.

**The intake questions stay IN scope**, and still get the full conservative treatment with every
string flagged. The patient answers those, so they must be in a language he actually reads — the
argument for one authoritative legal text does not apply to a form someone has to fill in.

**This group is a draft for review, not a publication.** Every string in it goes in the flagged
list regardless of confidence, because a native clinician reader — not the developer and not the
owner alone — signs these off.

### 8B.4 — Typography check
The item deferred from §8.4: Arabic needs more line-height than Latin at the same size. With real
strings on screen, check headings, buttons and chips do not clip or crowd. Report what you
adjusted.

### 8B.5 — The review artefact
Generate a side-by-side document — English left, Arabic right, paragraph-aligned, one page per
site page — that Dr. Allan can read on a phone and mark up. Not a diff; he is not going to read a
diff.

Include the flagged strings as a separate marked section at the top, so the thing needing his
attention is the first thing he sees.

Static HTML in the repo, not a route on the site. Say where you put it.

### 8B.6 — SEO, last
Language-aware `Seo.tsx`: translated title and description per page, `lang` on the html element,
`hreflang` alternates.

**It will be self-referential and that is expected** — without distinct `/ar/*` URLs there is
nothing else to point at. That is Phase 13 and is already noted in `FIX_PLAN.md`. Do not build it
here. State plainly in your report that Arabic search visibility does not exist until Phase 13
ships, so nobody mistakes this for done.

---

## Verify — after each group

The four gate commands, plus:

1. Key counts, and confirmation the two sets are identical.
2. Every `dir="auto"` you added, and confirmation none landed on a layout container.
3. Every `<bdi>`, with the value it wraps.
4. **The flagged-strings list, by key**, with what you were unsure about.
5. Precache and build size before and after.
6. That the switch is still gated off.

**Do not report deployment state. Do not flip the flag. Do not push.**
