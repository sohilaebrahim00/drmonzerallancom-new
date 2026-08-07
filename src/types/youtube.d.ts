declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface OnStateChangeEvent {
    data: PlayerState;
    target: Player;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    mute?: 0 | 1;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    modestbranding?: 0 | 1;
    controls?: 0 | 1;
  }

  interface PlayerEvents {
    onReady?: (event: { target: Player }) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
  }

  interface PlayerOptions {
    videoId?: string;
    playerVars?: PlayerVars;
    events?: PlayerEvents;
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    destroy(): void;
  }
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
