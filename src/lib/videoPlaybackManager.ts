type DeactivateHandler = () => void;

/**
 * Ensures only one embedded YouTube player autoplays at a time across the
 * whole site. When a player becomes visible it calls requestActive(id) —
 * whichever player was previously active gets its deactivate handler called
 * (pausing it) before the new one takes over.
 */
class VideoPlaybackManager {
  private activeId: string | null = null;
  private handlers = new Map<string, DeactivateHandler>();

  register(id: string, onDeactivate: DeactivateHandler) {
    this.handlers.set(id, onDeactivate);
  }

  unregister(id: string) {
    this.handlers.delete(id);
    if (this.activeId === id) this.activeId = null;
  }

  requestActive(id: string) {
    if (this.activeId === id) return;
    if (this.activeId) this.handlers.get(this.activeId)?.();
    this.activeId = id;
  }

  release(id: string) {
    if (this.activeId === id) this.activeId = null;
  }
}

export const videoPlaybackManager = new VideoPlaybackManager();
