export const youtubeChannelUrl = "https://youtube.com/@monzerallan?si=NxAdGsbsX6ADqHNz";

export type VideoCategory =
  | "Nutrition"
  | "Wellness"
  | "Education"
  | "Lifestyle"
  | "Metabolic Health";

export interface SiteVideo {
  id: string;
  /** YouTube video ID — verified against the channel's public RSS feed, never invented. */
  videoId: string;
  title: string;
  caption: string;
  category: VideoCategory;
  youtubeUrl: string;
  featured: boolean;
}

/**
 * Verified against the real, public Monzer Allan YouTube channel
 * (youtube.com/@monzerallan, channel ID UCZJs39F_2LDkj23Nfnazudg) via its
 * public RSS feed (youtube.com/feeds/videos.xml?channel_id=...) — no
 * YouTube Data API key required. Every videoId, title, and URL below is
 * copied verbatim from that feed. Captions are original summaries written
 * from each video's actual on-channel description, not invented.
 *
 * To refresh this list later: re-fetch the RSS feed above, confirm each
 * candidate video still embeds correctly, and update entries — never add an
 * ID that hasn't been verified against the real channel.
 */
export const videos: SiteVideo[] = [
  {
    id: "vitamin-d-deficiency-signs",
    videoId: "Ab2lp7JUQrA",
    title: "10 Signs of Vitamin D Deficiency You Shouldn't Ignore.",
    caption:
      "A rundown of common signs linked to low vitamin D — from fatigue and difficulty concentrating to joint stiffness and mood changes — plus general guidance on supplementation and target levels.",
    category: "Nutrition",
    youtubeUrl: "https://www.youtube.com/shorts/Ab2lp7JUQrA",
    featured: true,
  },
  {
    id: "iron-stores-drop",
    videoId: "vB9Dtr5xRpQ",
    title: "What Happens When Your Iron Stores Drop?",
    caption:
      "An overview of symptoms tied to low iron stores, such as fatigue, dizziness, and hair loss, along with practical guidance on testing and supporting healthy iron levels.",
    category: "Nutrition",
    youtubeUrl: "https://www.youtube.com/shorts/vB9Dtr5xRpQ",
    featured: false,
  },
  {
    id: "magnesium-types-timing",
    videoId: "9ZZK6Dw9qZg",
    title: "Types of Magnesium and Best Times to Take Them",
    caption: "A quick guide to the different forms of magnesium and when to take each one.",
    category: "Nutrition",
    youtubeUrl: "https://www.youtube.com/shorts/9ZZK6Dw9qZg",
    featured: false,
  },
  {
    id: "candida-treatment-stage-three",
    videoId: "w8mH53ioViI",
    title: "Stage Three of Kandida Treatment: Essential Remedies and Vitamins for Both Spouses",
    caption:
      "A look at a later stage of a Candida-support protocol, covering natural remedies and the vitamins commonly recommended alongside it.",
    category: "Wellness",
    youtubeUrl: "https://www.youtube.com/shorts/w8mH53ioViI",
    featured: false,
  },
  {
    id: "candida-treatment-bone-broth",
    videoId: "dVjbr3BrXYo",
    title: "Candida Treatment: Bone Broth, Steamed Veggies, and Herbal Remedies",
    caption:
      "A walkthrough of an early-stage Candida-support approach built around bone broth, steamed vegetables, and supportive herbs.",
    category: "Wellness",
    youtubeUrl: "https://www.youtube.com/shorts/dVjbr3BrXYo",
    featured: false,
  },
  {
    id: "candida-foods-to-avoid",
    videoId: "oikisoBykrw",
    title: "Candida Treatment: Foods to Avoid for Healing",
    caption:
      "Practical guidance on the foods commonly avoided during a Candida-support protocol, and why they can work against progress.",
    category: "Wellness",
    youtubeUrl: "https://www.youtube.com/shorts/oikisoBykrw",
    featured: false,
  },
  {
    id: "autoimmune-path-before-medication",
    videoId: "E68mz2MTSHw",
    title: "The Path to Treating Autoimmune Diseases: Essential Steps Before Medication",
    caption:
      "A discussion on the foundational steps — digestion, diet, exercise, sleep, and stress management — often addressed before or alongside autoimmune treatment.",
    category: "Metabolic Health",
    youtubeUrl: "https://www.youtube.com/shorts/E68mz2MTSHw",
    featured: false,
  },
  {
    id: "one-simple-habit",
    videoId: "sb2WC1CuVCc",
    title: "One simple habit can support a healthier lifestyle.",
    caption: "A short, practical habit that can make everyday healthy living easier to sustain.",
    category: "Lifestyle",
    youtubeUrl: "https://www.youtube.com/shorts/sb2WC1CuVCc",
    featured: false,
  },
];

export function getFeaturedVideo(): SiteVideo | undefined {
  return videos.find((video) => video.featured) ?? videos[0];
}

export function getVideosByCategory(category: VideoCategory | "All"): SiteVideo[] {
  if (category === "All") return videos;
  return videos.filter((video) => video.category === category);
}
