/**
 * The one place that decides where the floating controls sit.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * StickyCta and BackToTop were both written as `fixed bottom-6 start-5`, in
 * separate files, mounted as unaware siblings in App.tsx. Neither knew the
 * other existed, so on the live site the scroll-to-top button covered 95% of
 * the "View Programs" pill — INCLUDING ITS DISMISS BUTTON. A visitor who
 * wanted the pill gone could not remove it, because the control that removes
 * it was underneath another control. That is a functional bug, not a visual
 * one, which is what decides the fix: the offset has to react to whether the
 * pill is actually on screen, not be a constant someone tuned once.
 *
 * A magic `bottom-24` on BackToTop would have hidden the coupling again and
 * silently broken the moment the pill changed height or stopped rendering.
 *
 * ── HOW TO ADD A FOURTH CONTROL ────────────────────────────────────────────
 * Add it to SLOTS below. There is nowhere else to put it: `useFloatingSlot`
 * only accepts an id declared here, so a new control does not compile until
 * someone has decided which side it belongs on and what it stacks against.
 * That is the point — the next person is forced to place it deliberately.
 *
 * Placement is NOT redesigned here. Sohila is reviewing the cluster on a real
 * phone; this only stops the controls occluding each other.
 */
import { useCallback, useSyncExternalStore } from "react";

export type FloatingId = "viewProgramsPill" | "backToTop" | "chat";

interface Slot {
  /** Which edge it hugs. `start`/`end` are logical, so both flip under RTL. */
  side: "start" | "end";
  /**
   * Order out from the bottom edge. 0 sits on the edge; 1 sits above whatever
   * occupies 0 on the same side, but only while that control is present.
   */
  order: number;
  /** Rendered height in px, used to offset whatever stacks above it. */
  height: number;
}

/**
 * The stack, declared once.
 *
 * chat and viewProgramsPill are both order 0 because they are on OPPOSITE
 * sides — they have never collided and the deferred redesign may move them
 * anyway. backToTop is order 1 on the start side, which is the whole fix.
 */
const SLOTS: Record<FloatingId, Slot> = {
  viewProgramsPill: { side: "start", order: 0, height: 42 },
  backToTop: { side: "start", order: 1, height: 44 },
  chat: { side: "end", order: 0, height: 56 },
};

/** Vertical breathing room between two stacked controls. */
const GAP = 12;

// A module-level set of what is currently on screen, with useSyncExternalStore
// over it. Deliberately not React context: these three are siblings in App.tsx
// with no common wrapper, and adding a provider purely for this would be a
// larger change than the bug justifies.
const present = new Set<FloatingId>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * How far this control must lift to clear everything below it on its own side.
 * Recomputed from what is actually rendered, so the pill appearing or being
 * dismissed moves BackToTop immediately.
 */
function offsetFor(id: FloatingId): number {
  const me = SLOTS[id];
  let offset = 0;
  for (const [otherId, slot] of Object.entries(SLOTS) as [FloatingId, Slot][]) {
    if (otherId === id) continue;
    if (slot.side !== me.side) continue;
    if (slot.order >= me.order) continue;
    if (!present.has(otherId)) continue;
    offset += slot.height + GAP;
  }
  return offset;
}

/**
 * Declares that this control is on screen, and returns the style that keeps it
 * clear of the ones below it.
 *
 * `marginBottom` rather than a `bottom` override or a transform: the controls
 * keep their existing `bottom-6 sm:bottom-8` Tailwind classes (so the
 * responsive base is untouched), and both animate with framer-motion, which
 * owns `transform`.
 */
export function useFloatingSlot(id: FloatingId, visible: boolean): { marginBottom: number } {
  const sub = useCallback(
    (listener: () => void) => {
      // Registration happens in the subscribe callback so it runs during
      // commit and is undone on unmount, without a second effect.
      if (visible) present.add(id);
      else present.delete(id);
      emit();
      const off = subscribe(listener);
      return () => {
        present.delete(id);
        off();
        emit();
      };
    },
    [id, visible],
  );

  const offset = useSyncExternalStore(
    sub,
    () => offsetFor(id),
    () => 0, // server/prerender: no stack, everything sits on the edge
  );

  return { marginBottom: offset };
}
