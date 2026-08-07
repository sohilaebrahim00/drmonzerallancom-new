export const youtubeChannelUrl = "https://youtube.com/@monzerallan?si=NxAdGsbsX6ADqHNz";

export type VideoCategory = "Nutrition" | "Wellness" | "Education" | "Lifestyle" | "Metabolic Health";

export interface SiteVideo {
  id: string;
  /** YouTube video ID, e.g. "dQw4w9WgXcQ" — never invented, always copied from a real video URL. */
  videoId: string;
  title: string;
  caption: string;
  category: VideoCategory;
  youtubeUrl: string;
  featured: boolean;
}

/**
 * Intentionally empty: the channel above is real and verified, but this
 * static site cannot safely hold a YouTube Data API key to pull "latest
 * uploads" automatically, and a direct fetch of the channel's videos page
 * returns no listing (YouTube renders it client-side with JavaScript). No
 * video ID, title, or caption here has been invented.
 *
 * To activate video sections across the site: open the channel, copy each
 * video's ID from its URL (the part after `v=` or after `youtu.be/`), watch
 * the video, and add an entry with an accurate title/caption/category below.
 * Every video-dependent section (Watch & Learn, Gallery) already renders an
 * honest "coming soon" state when this array is empty, and will pick up
 * entries here automatically once added.
 */
export const videos: SiteVideo[] = [];

export function getFeaturedVideo(): SiteVideo | undefined {
  return videos.find((video) => video.featured) ?? videos[0];
}

export function getVideosByCategory(category: VideoCategory | "All"): SiteVideo[] {
  if (category === "All") return videos;
  return videos.filter((video) => video.category === category);
}
