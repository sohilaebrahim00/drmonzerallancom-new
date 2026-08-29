import { useEffect, useId, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { loadYouTubeIframeApi } from "@/lib/youtubeApi";
import { videoPlaybackManager } from "@/lib/videoPlaybackManager";
import { cn } from "@/lib/utils";

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
  /** When true (default), the player autoplays muted once ~50% visible and pauses when out of view. */
  autoplayOnVisible?: boolean;
}

export function YouTubeEmbed({
  videoId,
  title,
  className,
  autoplayOnVisible = true,
}: YouTubeEmbedProps) {
  const rawId = useId();
  const uniqueId = `yt-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(!autoplayOnVisible);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!autoplayOnVisible) return;
    let destroyed = false;

    loadYouTubeIframeApi()
      .then((YTApi) => {
        if (destroyed) return;
        playerRef.current = new YTApi.Player(uniqueId, {
          videoId,
          playerVars: { playsinline: 1, mute: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => setReady(true),
            onStateChange: (event) => {
              setPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
        videoPlaybackManager.register(uniqueId, () => {
          playerRef.current?.pauseVideo();
        });
      })
      .catch(() => {
        if (!destroyed) setFallback(true);
      });

    return () => {
      destroyed = true;
      videoPlaybackManager.unregister(uniqueId);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, autoplayOnVisible]);

  useEffect(() => {
    if (!ready || fallback || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoPlaybackManager.requestActive(uniqueId);
            playerRef.current?.mute();
            playerRef.current?.playVideo();
          } else {
            playerRef.current?.pauseVideo();
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fallback]);

  function toggleMute() {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }

  if (fallback) {
    return (
      <div className={cn("aspect-video w-full overflow-hidden rounded-2xl bg-navy/10", className)}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1`}
          title={title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-navy/10",
        className,
      )}
    >
      <div id={uniqueId} className="h-full w-full" aria-label={title} />
      {playing && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 end-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-navy/70 text-white backdrop-blur-sm transition-colors hover:bg-navy"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
