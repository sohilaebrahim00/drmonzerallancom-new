import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Navigation2 } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/data/cities";
import { useCompassHeading } from "@/hooks/use-compass-heading";
import { useResolvedLocation } from "@/hooks/use-resolved-location";
import { computeQiblaBearing } from "@/services/qiblaService";

export default function NativeQibla() {
  const {
    coords,
    state: locationState,
    requesting,
    useMyLocation,
    pickCity,
  } = useResolvedLocation();
  const {
    heading,
    supported: compassSupported,
    permissionState,
    requestPermission,
  } = useCompassHeading();
  const [wobble, setWobble] = useState(false);

  const qiblaBearing = useMemo(() => (coords ? computeQiblaBearing(coords) : null), [coords]);
  const deviceRelative = heading !== null && qiblaBearing !== null;
  const indicatorRotation = deviceRelative
    ? (qiblaBearing! - heading! + 360) % 360
    : (qiblaBearing ?? 0);
  const roseRotation = heading !== null ? -heading : 0;

  useEffect(() => {
    if (compassSupported && heading !== null) {
      const t = setTimeout(() => setWobble(true), 4000);
      return () => clearTimeout(t);
    }
  }, [compassSupported, heading]);

  return (
    <AppScreen
      title="Qibla"
      back
      scroll={false}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      {locationState === "resolving" && (
        <div className="flex justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      )}

      {(locationState === "needed" || locationState === "denied") && (
        <div className="w-full max-w-xs rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <p className="mt-3 font-display text-base font-bold text-navy">Where are you?</p>
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <Button onClick={useMyLocation} disabled={requesting} className="w-full cursor-pointer">
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Use My Location
            </Button>
            <select
              aria-label="Choose a city"
              defaultValue=""
              onChange={(e) => e.target.value && pickCity(e.target.value)}
              className="h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-navy outline-none"
            >
              <option value="" disabled>
                Choose a city instead…
              </option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.country}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {qiblaBearing !== null && (
        <>
          {permissionState === "needs-request" && (
            <Button
              onClick={requestPermission}
              variant="outline"
              className="mb-4 w-full max-w-xs cursor-pointer"
            >
              <Navigation2 className="h-4 w-4" /> Enable Compass
            </Button>
          )}

          <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-border/70 bg-gradient-to-br from-secondary to-card shadow-[0_30px_60px_-30px_rgba(23,35,59,0.35)] sm:h-80 sm:w-80">
            <div
              className="absolute inset-3 rounded-full border border-border/50 transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${roseRotation}deg)` }}
            >
              {["N", "E", "S", "W"].map((label, i) => (
                <span
                  key={label}
                  className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-bold text-muted-foreground"
                  style={{ transform: `rotate(${i * 90}deg)`, transformOrigin: "50% 140px" }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div
              className="absolute inset-0 flex items-start justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${indicatorRotation}deg)` }}
            >
              <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_20px_-8px_rgba(37,63,164,0.6)]">
                <span aria-hidden="true" className="text-lg">
                  🕋
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <p className="font-display text-4xl font-extrabold text-navy">
                {Math.round(qiblaBearing)}°
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                from true north
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {deviceRelative
              ? "Turn until the Kaaba marker points to the top of the circle."
              : compassSupported
                ? "Waiting for your device's compass…"
                : `Compass unavailable — align your phone to face ${Math.round(qiblaBearing)}° using a separate compass app.`}
          </p>

          {deviceRelative && wobble && (
            <p className="mt-2 text-xs text-muted-foreground/80">
              Move your phone in a figure-eight motion to improve compass accuracy.
            </p>
          )}
        </>
      )}
    </AppScreen>
  );
}
