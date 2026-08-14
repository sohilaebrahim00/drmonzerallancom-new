import { Coordinates, Qibla } from "adhan";

import type { Coords } from "@/services/prayerTimesService";

/**
 * Great-circle bearing (degrees from true north) to the Kaaba — delegates to
 * `adhan`'s verified `Qibla()` implementation rather than hand-rolling the
 * spherical trigonometry.
 */
export function computeQiblaBearing(coords: Coords): number {
  return Qibla(new Coordinates(coords.latitude, coords.longitude));
}
