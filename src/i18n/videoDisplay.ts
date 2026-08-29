import type { SiteVideo } from "@/data/videos";
import type { TranslateFn } from "./translate";
import { VIDEO_LABELS } from "./videoLabels";

/** Display title, falling back to the stored English if an id has no keys. */
export function videoTitle(v: SiteVideo, t: TranslateFn): string {
  const k = VIDEO_LABELS[v.id];
  return k ? t(k.title) : v.title;
}

export function videoCaption(v: SiteVideo, t: TranslateFn): string {
  const k = VIDEO_LABELS[v.id];
  return k ? t(k.caption) : v.caption;
}
