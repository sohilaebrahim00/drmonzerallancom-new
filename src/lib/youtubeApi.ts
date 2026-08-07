let apiPromise: Promise<typeof window.YT> | null = null;

/** Loads the YouTube IFrame Player API once and caches the promise. */
export function loadYouTubeIframeApi(): Promise<typeof window.YT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window available"));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the YouTube IFrame API"));
    document.head.appendChild(script);

    window.setTimeout(() => {
      if (!(window.YT && window.YT.Player)) {
        reject(new Error("YouTube IFrame API timed out"));
      }
    }, 8000);
  });

  return apiPromise;
}
