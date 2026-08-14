import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Barcode, Loader2, Search, X } from "lucide-react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/app-native/components/EmptyState";
import { useLocationState } from "@/app-native/useLocationState";
import {
  lookupFoodByBarcode,
  searchFoodByName,
  supportsLiveBarcodeScanning,
  type FoodDatabaseResult,
} from "@/services/foodDatabaseService";
import type { FoodScanResult } from "@/services/foodScanService";

type Mode = "search" | "barcode";

/**
 * The fast alternative to the camera flow — useful when the AI photo
 * estimate is uncertain, or the food is packaged (barcode). Real results
 * from Open Food Facts (see foodDatabaseService.ts), never invented
 * numbers. Hands off to the same NativeFoodResult review/correct/save
 * screen the camera flow uses — one save path, not two.
 */
export default function NativeFoodSearch() {
  const navigate = useNavigate();
  const programItemId = useLocationState<string>("programItemId");
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodDatabaseResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "search") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchFoodByName(query);
      setResults(found);
      setSearching(false);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  function selectResult(result: FoodDatabaseResult) {
    const scanResult: FoodScanResult = {
      foodDetected: true,
      foods: [
        {
          name: result.brand ? `${result.name} (${result.brand})` : result.name,
          estimatedPortion: result.servingDescription ?? "1 serving",
          estimatedCalories: result.caloriesPerServing,
          proteinGrams: result.proteinGrams,
          carbohydrateGrams: result.carbohydrateGrams,
          fatGrams: result.fatGrams,
        },
      ],
      totalEstimatedCalories: result.caloriesPerServing,
      confidence: "medium",
      notes: "From food database search — confirm serving size before saving.",
    };
    navigate("/food-scanner/result", {
      state: { result: scanResult, programItemId },
      replace: true,
    });
  }

  async function handleBarcodeLookup() {
    if (!barcodeInput.trim() || lookingUp) return;
    setLookingUp(true);
    setBarcodeError(null);
    const outcome = await lookupFoodByBarcode(barcodeInput);
    setLookingUp(false);
    if (!outcome.ok) {
      setBarcodeError(
        outcome.reason === "NOT_FOUND"
          ? "No product found for that barcode."
          : "Barcode lookup is temporarily unavailable.",
      );
      return;
    }
    selectResult(outcome.result);
  }

  return (
    <AppScreen title="Search Food" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "search" ? "border-primary bg-secondary/60 text-primary" : "border-border text-navy/70"}`}
        >
          <Search className="mr-1.5 inline h-4 w-4" /> Search
        </button>
        <button
          type="button"
          onClick={() => setMode("barcode")}
          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "barcode" ? "border-primary bg-secondary/60 text-primary" : "border-border text-navy/70"}`}
        >
          <Barcode className="mr-1.5 inline h-4 w-4" /> Barcode
        </button>
      </div>

      {mode === "search" ? (
        <div className="mt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. grilled chicken breast"
              className="pl-9"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {searching && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <EmptyState
                icon={Search}
                title="No matches found"
                body="Try a simpler search term, or use the camera scanner instead."
              />
            )}
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-app-surface p-3 text-left transition-colors hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.brand ? `${r.brand} — ` : ""}
                    {r.servingDescription}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-navy">
                  {r.caloriesPerServing}
                  <span className="ml-0.5 text-[0.65rem] font-normal text-muted-foreground">
                    kcal
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[0.7rem] text-muted-foreground">
            Nutrition data from Open Food Facts — estimates, not lab measurements.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {supportsLiveBarcodeScanning()
              ? "Enter the barcode number, or use your camera where supported."
              : "Live barcode scanning isn't supported in this browser — enter the barcode number instead."}
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 0049000028911"
              inputMode="numeric"
            />
            <Button
              onClick={handleBarcodeLookup}
              disabled={!barcodeInput.trim() || lookingUp}
              className="shrink-0 cursor-pointer"
            >
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
            </Button>
          </div>
          {barcodeError && (
            <Alert className="mt-3 border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>{barcodeError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </AppScreen>
  );
}
