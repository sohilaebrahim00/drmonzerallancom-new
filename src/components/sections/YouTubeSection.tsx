import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Play, Youtube } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { videos, youtubeChannelUrl } from "@/data/videos";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/i18n";

export function YouTubeSection() {
  const t = useTranslate();
  const [activeId, setActiveId] = useState(videos[0]?.id);
  const activeVideo = videos.find((v) => v.id === activeId) ?? videos[0];

  return (
    <section id="watch" className="relative py-20 sm:py-28" aria-labelledby="watch-heading">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow={t("videos.eyebrow")}
          title={t("videos.title")}
          description={t("videos.description")}
        />

        <div className="mt-14">
          {activeVideo ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <YouTubeEmbed
                  key={activeVideo.videoId}
                  videoId={activeVideo.videoId}
                  title={activeVideo.title}
                  className="shadow-[0_30px_60px_-30px_rgba(23,35,59,0.35)]"
                />
              </div>
              <div className="flex flex-col gap-4">
                <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  {activeVideo.category}
                </span>
                <h3 className="font-display text-xl font-bold text-navy">{activeVideo.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {activeVideo.caption}
                </p>
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:text-turquoise"
                >
                  Watch on YouTube <ExternalLink className="h-3.5 w-3.5" />
                </a>

                {videos.length > 1 && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {videos.map((video) => (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => setActiveId(video.id)}
                        className={cn(
                          "group flex flex-col gap-2 rounded-xl border p-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          activeId === video.id
                            ? "border-primary bg-secondary/50"
                            : "border-border hover:border-turquoise/60",
                        )}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-navy/10">
                          {/* hqdefault is always 480x360; stating it reserves
                              the box so the strip does not reflow as eight
                              thumbnails arrive one by one. */}
                          <img
                            src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                            alt=""
                            width={480}
                            height={360}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-navy/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="h-6 w-6 text-white" />
                          </span>
                        </div>
                        <span className="line-clamp-2 text-xs font-semibold text-navy">
                          {video.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center">
              <Youtube className="h-8 w-8 text-primary/60" />
              <p className="font-display text-lg font-bold text-navy">Video Library Coming Soon</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Featured videos will appear here directly from the channel.
              </p>
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
              >
                <Youtube className="h-4 w-4" /> Visit the YouTube Channel
              </a>
            </div>
          )}
        </div>

        {videos.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link to="/gallery" className="text-sm font-semibold text-primary hover:text-turquoise">
              Watch More in the Gallery
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
