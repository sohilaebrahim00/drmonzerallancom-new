import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, ImagePlus, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useLocationState } from "@/app-native/useLocationState";
import { foodScannerRequiresMembership } from "@/config/mobileApp";
import { getMySubscription } from "@/services/membershipService";
import {
  capturePhoto,
  compressImage,
  pickFromGallery,
  scanFood,
  type CompressedImage,
} from "@/services/foodScanService";

type Screen = "idle" | "preview" | "analyzing" | "error";

// Purely presentational — cycles while the real Gemini call is in flight
// (see handleAnalyze below), never used to fake a result or a completion
// state ahead of the actual response.
const ANALYZING_STAGES = [
  "Analyzing meal…",
  "Identifying foods…",
  "Estimating portions…",
  "Preparing nutrition…",
];

export default function NativeFoodScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const programItemId = useLocationState<string>("programItemId");
  const [gateChecked, setGateChecked] = useState(!foodScannerRequiresMembership);
  const [hasMembership, setHasMembership] = useState(!foodScannerRequiresMembership);

  const [screen, setScreen] = useState<Screen>("idle");
  const [image, setImage] = useState<CompressedImage | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (screen !== "analyzing") return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, ANALYZING_STAGES.length - 1));
    }, 1100);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (!foodScannerRequiresMembership) return;
    if (!user) {
      setGateChecked(true);
      setHasMembership(false);
      return;
    }
    getMySubscription().then((sub) => {
      setHasMembership(Boolean(sub));
      setGateChecked(true);
    });
  }, [user]);

  async function handleCapture(source: "camera" | "gallery") {
    const photo = source === "camera" ? await capturePhoto() : await pickFromGallery();
    if (!photo) return;
    const compressed = await compressImage(photo.dataUrl);
    setImage(compressed);
    setScreen("preview");
  }

  function handleRetake() {
    setImage(null);
    setScreen("idle");
  }

  async function handleAnalyze() {
    if (!image) return;
    setScreen("analyzing");
    setErrorMessage("");
    const outcome = await scanFood(image);
    if (!outcome.ok) {
      setErrorMessage(outcome.error);
      setScreen("error");
      return;
    }
    navigate("/food-scanner/result", {
      state: { result: outcome.data, programItemId },
      replace: true,
    });
  }

  if (!gateChecked) {
    return (
      <AppScreen
        title="Food Scanner"
        back
        className="flex min-h-[50vh] items-center justify-center"
      >
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </AppScreen>
    );
  }

  if (foodScannerRequiresMembership && !hasMembership) {
    return (
      <AppScreen
        title="Food Scanner"
        back
        className="mx-auto w-full max-w-lg px-4 py-10 text-center"
      >
        <p className="font-display text-lg font-bold text-navy">Food Scanner is a member feature</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Join a membership to unlock photo-based nutrition estimates.
        </p>
        <Button asChild className="mt-5 cursor-pointer">
          <Link to="/join">View Memberships</Link>
        </Button>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="Food Scanner"
      back
      className="mx-auto flex w-full max-w-lg flex-col px-4 pb-8 pt-3"
    >
      {screen === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
          <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-navy to-primary text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]">
            <span className="absolute inset-0 rounded-full ring-8 ring-secondary/60" />
            <Camera className="h-11 w-11" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-navy">Scan Your Meal</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Estimated calories &amp; macros from a photo.
            </p>
          </div>
          <div className="mt-3 flex w-full max-w-xs flex-col gap-2.5">
            <Button onClick={() => handleCapture("camera")} className="w-full cursor-pointer">
              <Camera className="h-4 w-4" /> Take Photo
            </Button>
            <Button
              onClick={() => handleCapture("gallery")}
              variant="outline"
              className="w-full cursor-pointer"
            >
              <ImagePlus className="h-4 w-4" /> Choose From Gallery
            </Button>
            <Link
              to="/food-scanner/search"
              state={{ programItemId }}
              className="cursor-pointer text-center text-xs font-semibold text-primary"
            >
              Search Food or Scan Barcode Instead
            </Link>
          </div>

          <div className="mt-5 grid w-full max-w-xs grid-cols-2 gap-2">
            <Link
              to="/favorites"
              className="rounded-xl border border-border/60 bg-app-surface px-3 py-2.5 text-center text-xs font-semibold text-navy transition-colors hover:border-primary/40"
            >
              Recent &amp; Favorites
            </Link>
            <Link
              to="/food-scanner/custom-meal"
              state={{ programItemId }}
              className="rounded-xl border border-border/60 bg-app-surface px-3 py-2.5 text-center text-xs font-semibold text-navy transition-colors hover:border-primary/40"
            >
              Create Custom Meal
            </Link>
          </div>
        </div>
      )}

      {(screen === "preview" || screen === "analyzing") && image && (
        <div className="flex flex-1 flex-col justify-center">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <img
              src={image.dataUrl}
              alt="Captured meal"
              className="aspect-square w-full object-cover"
            />
            {screen === "analyzing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy/65 text-white backdrop-blur-[2px]">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm font-semibold transition-opacity duration-300">
                  {ANALYZING_STAGES[stageIndex]}
                </p>
              </div>
            )}
          </div>
          {screen === "preview" && (
            <div className="mt-4 flex gap-3">
              <Button onClick={handleRetake} variant="outline" className="flex-1 cursor-pointer">
                <RotateCcw className="h-4 w-4" /> Retake
              </Button>
              <Button onClick={handleAnalyze} className="flex-1 cursor-pointer">
                <Sparkles className="h-4 w-4" /> Analyze
              </Button>
            </div>
          )}
        </div>
      )}

      {screen === "error" && (
        <div className="flex flex-1 flex-col justify-center">
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button onClick={handleRetake} variant="outline" className="mt-4 w-full cursor-pointer">
            Try Again
          </Button>
        </div>
      )}
    </AppScreen>
  );
}
