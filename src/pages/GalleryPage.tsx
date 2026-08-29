import { ExternalLink, Images, ScrollText, Sparkles, UsersRound, Youtube } from "lucide-react";

import { Seo } from "@/components/seo/Seo";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { BookingButton } from "@/components/booking/BookingButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { videos, youtubeChannelUrl } from "@/data/videos";
import { breadcrumbSchema } from "@/lib/schema";
import {
  useTranslate,
  VIDEO_CATEGORY_LABELS,
  type SimpleTranslationKey,
  videoTitle,
  videoCaption,
} from "@/i18n";

/**
 * Display-only cards. Unlike the FAQ/article/product/video categories these
 * drive no filter and are compared against nothing, so they carry dictionary
 * keys directly rather than needing an identity/display split. `titleKey` is
 * also the React key — stable across locales, which the rendered title would
 * not be.
 */
const VISUAL_STORIES: {
  titleKey: SimpleTranslationKey;
  descriptionKey: SimpleTranslationKey;
  icon: typeof UsersRound;
}[] = [
  {
    titleKey: "galleryPage.storyInPractice",
    descriptionKey: "galleryPage.storyInPracticeBody",
    icon: UsersRound,
  },
  {
    titleKey: "galleryPage.storyBehindKnowledge",
    descriptionKey: "galleryPage.storyBehindKnowledgeBody",
    icon: ScrollText,
  },
  {
    titleKey: "galleryPage.storyEducational",
    descriptionKey: "galleryPage.storyEducationalBody",
    icon: Sparkles,
  },
  {
    titleKey: "galleryPage.storyEvents",
    descriptionKey: "galleryPage.storyEventsBody",
    icon: UsersRound,
  },
  {
    titleKey: "galleryPage.storyJourney",
    descriptionKey: "galleryPage.storyJourneyBody",
    icon: ScrollText,
  },
];

export default function GalleryPage() {
  const t = useTranslate();
  const featured = videos.find((v) => v.featured) ?? videos[0];
  const videoStories = videos.filter((v) => v.id !== featured?.id);

  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
  ]);

  return (
    <div>
      <Seo
        title="Gallery"
        description="Photos and videos from Dr. Monzer Allan's practice, education, and community — a look inside the work."
        path="/gallery"
        jsonLd={jsonLd}
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-10 sm:px-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("common.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("nav.gallery")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page hero — media-led cinematic */}
      <section className="relative overflow-hidden py-14 text-center sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-navy via-primary to-turquoise/60 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-2xl px-6 sm:px-10">
          <div>
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              Gallery
            </p>
            <h1
              dir="auto"
              className="mt-4 font-display text-4xl font-extrabold tracking-tight text-navy sm:text-5xl"
            >
              A Look Inside the Practice
            </h1>
            <p
              dir="auto"
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              Photography and video from consultations, education, and community life. Every image
              and video here is real — before-and-after content is only ever published with a
              client&apos;s explicit consent.
            </p>
          </div>
        </div>
      </section>

      {/* Featured story */}
      {featured ? (
        <section className="pb-16 sm:pb-24">
          <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
            <div>
              <YouTubeEmbed
                videoId={featured.videoId}
                title={videoTitle(featured, t)}
                className="shadow-[0_40px_80px_-30px_rgba(23,35,59,0.4)]"
              />
              <div className="mt-5 text-center">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  {t(VIDEO_CATEGORY_LABELS[featured.category])}
                </span>
                <h2 dir="auto" className="mt-3 font-display text-xl font-bold text-navy">
                  {videoTitle(featured, t)}
                </h2>
                <p
                  dir="auto"
                  className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground"
                >
                  {videoCaption(featured, t)}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="pb-16 sm:pb-24">
          <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center">
              <Youtube className="h-8 w-8 text-primary/60" />
              <p dir="auto" className="font-display text-lg font-bold text-navy">
                Video Stories Coming Soon
              </p>
              <p dir="auto" className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Featured video stories from the real channel will appear here.
              </p>
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
              >
                Visit the YouTube Channel <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Alternating video story rows */}
      {videoStories.length > 0 && (
        <section className="pb-16 sm:pb-24">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 sm:px-10">
            {videoStories.map((video, index) => (
              <div
                key={video.id}
                className={`grid grid-cols-1 items-center gap-8 lg:grid-cols-2 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <YouTubeEmbed videoId={video.videoId} title={videoTitle(video, t)} />
                <div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                    {t(VIDEO_CATEGORY_LABELS[video.category])}
                  </span>
                  <h3 dir="auto" className="mt-3 font-display text-lg font-bold text-navy">
                    {videoTitle(video, t)}
                  </h3>
                  <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {videoCaption(video, t)}
                  </p>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:text-turquoise"
                  >
                    Watch on YouTube <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Visual stories — photo categories */}
      <section className="border-t border-border/60 bg-secondary/20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p
              dir="auto"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-primary"
            >
              Visual Stories
            </p>
            <h2
              dir="auto"
              className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
            >
              Photography From the Practice
            </h2>
            <p dir="auto" className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We&apos;re preparing approved photography for each of these categories. Nothing shown
              here is a placeholder photo — real images will appear once available.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_STORIES.map((story, index) => (
              <div key={story.titleKey}>
                <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                    <story.icon className="h-6 w-6" />
                  </div>
                  <h3 dir="auto" className="font-display text-base font-bold text-navy">
                    {t(story.titleKey)}
                  </h3>
                  <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
                    {t(story.descriptionKey)}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
                    <Images className="h-3 w-3" /> Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <BookingButton label="Book a Consultation" />
          </div>
        </div>
      </section>
    </div>
  );
}
