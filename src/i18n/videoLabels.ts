import type { SimpleTranslationKey } from "./dictionaries/en";

/**
 * Video id -> display keys.
 *
 * The id is the identity (React key, active-tab state); the videoId is the
 * YouTube identity. Only title and caption are display.
 *
 * FLAGGED: the English titles in src/data/videos.ts are copied verbatim from
 * the channel's public RSS feed, so an Arabic reader sees a translated title
 * here and the original English title after they click through to YouTube.
 * The alternative — leaving the titles English — makes the section unreadable
 * for the reader we are translating for. The captions are our own summaries,
 * so they carry no such tension.
 */
export const VIDEO_LABELS: Record<
  string,
  { title: SimpleTranslationKey; caption: SimpleTranslationKey }
> = {
  "vitamin-d-deficiency-signs": {
    title: "video.vitaminDDeficiencySigns.title",
    caption: "video.vitaminDDeficiencySigns.caption",
  },
  "iron-stores-drop": {
    title: "video.ironStoresDrop.title",
    caption: "video.ironStoresDrop.caption",
  },
  "magnesium-types-timing": {
    title: "video.magnesiumTypesTiming.title",
    caption: "video.magnesiumTypesTiming.caption",
  },
  "candida-treatment-stage-three": {
    title: "video.candidaTreatmentStageThree.title",
    caption: "video.candidaTreatmentStageThree.caption",
  },
  "candida-treatment-bone-broth": {
    title: "video.candidaTreatmentBoneBroth.title",
    caption: "video.candidaTreatmentBoneBroth.caption",
  },
  "candida-foods-to-avoid": {
    title: "video.candidaFoodsToAvoid.title",
    caption: "video.candidaFoodsToAvoid.caption",
  },
  "autoimmune-path-before-medication": {
    title: "video.autoimmunePathBeforeMedication.title",
    caption: "video.autoimmunePathBeforeMedication.caption",
  },
  "one-simple-habit": {
    title: "video.oneSimpleHabit.title",
    caption: "video.oneSimpleHabit.caption",
  },
};
