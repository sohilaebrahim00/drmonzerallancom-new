import { useState } from "react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { getFeaturedVideo, videos } from "@/data/videos";
import { cn } from "@/lib/utils";

export default function NativeVideos() {
  const [activeId, setActiveId] = useState(() => getFeaturedVideo()?.id ?? videos[0]?.id);
  const activeVideo = videos.find((v) => v.id === activeId) ?? videos[0];

  return (
    <AppScreen title="Watch & Learn" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      {activeVideo && (
        <>
          <YouTubeEmbed
            key={activeVideo.videoId}
            videoId={activeVideo.videoId}
            title={activeVideo.title}
            className="rounded-2xl shadow-sm"
          />
          <p className="mt-3 font-display text-base font-bold text-navy">{activeVideo.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{activeVideo.caption}</p>
        </>
      )}

      <div className="mt-5 space-y-2">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActiveId(video.id)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
              video.id === activeId
                ? "border-primary bg-secondary"
                : "border-border/70 bg-card hover:bg-secondary",
            )}
          >
            <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
              <span className="text-xs font-bold">▶</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy">{video.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{video.category}</span>
            </span>
          </button>
        ))}
      </div>
    </AppScreen>
  );
}
