import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

import { isNativePlatform } from "@/hooks/use-native-platform";
import { supabase } from "@/lib/supabase";

const UNAVAILABLE_MESSAGE = "Food scanning is temporarily unavailable. Please try again shortly.";
const MEMBERSHIP_REQUIRED_MESSAGE =
  "The Food Scanner is available to active members. Join a membership to unlock nutrition scanning.";
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

export type CapturedImage = { dataUrl: string };

/**
 * Web/PWA image-acquisition adapter: browsers have no Capacitor Camera
 * plugin, so this uses a plain file input instead. `capture="environment"`
 * hints mobile browsers (notably iOS/Android Safari & Chrome) to open the
 * camera directly for "Take Photo"; desktop browsers and browsers that
 * ignore the hint fall back to their normal file/photo picker — never a
 * broken control either way. Some browsers never fire `change` when the
 * visitor cancels the native picker, so a `window focus` fallback resolves
 * the promise instead of hanging forever.
 */
function pickImageViaFileInput(useCameraCapture: boolean): Promise<CapturedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (useCameraCapture) input.setAttribute("capture", "environment");
    input.style.position = "fixed";
    input.style.top = "-1000px";
    input.style.left = "-1000px";

    let settled = false;
    function finish(value: CapturedImage | null) {
      if (settled) return;
      settled = true;
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
      resolve(value);
    }
    function onWindowFocus() {
      window.setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) finish(null);
      }, 300);
    }

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => finish({ dataUrl: reader.result as string });
      reader.onerror = () => finish(null);
      reader.readAsDataURL(file);
    });
    input.addEventListener("cancel", () => finish(null));
    window.addEventListener("focus", onWindowFocus);

    document.body.appendChild(input);
    input.click();
  });
}

/** Opens the camera (native Camera plugin, or a browser file input hinted to the camera on web/PWA). Only call from the explicit "Take Photo" action. */
export async function capturePhoto(): Promise<CapturedImage | null> {
  if (!isNativePlatform()) return pickImageViaFileInput(true);
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 80,
      allowEditing: false,
    });
    return photo.dataUrl ? { dataUrl: photo.dataUrl } : null;
  } catch {
    // User cancelled, or permission denied — treated the same: no photo.
    return null;
  }
}

/** Opens the photo library (native Camera plugin, or a plain browser file picker on web/PWA). Only call from the explicit "Choose From Gallery" action. */
export async function pickFromGallery(): Promise<CapturedImage | null> {
  if (!isNativePlatform()) return pickImageViaFileInput(false);
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 80,
      allowEditing: false,
    });
    return photo.dataUrl ? { dataUrl: photo.dataUrl } : null;
  } catch {
    return null;
  }
}

export interface CompressedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

/**
 * Resizes to a reasonable max dimension and re-encodes as JPEG via canvas —
 * keeps enough detail for food recognition while avoiding uploading a
 * multi-megabyte original camera file. Re-encoding through canvas also
 * naturally drops EXIF metadata (GPS tags, device info) from the original.
 */
export function compressImage(dataUrl: string): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const outputDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const base64 = outputDataUrl.split(",")[1] ?? "";
      resolve({ dataUrl: outputDataUrl, base64, mimeType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
}

export interface FoodItem {
  name: string;
  estimatedPortion: string;
  estimatedCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

export interface FoodScanResult {
  foodDetected: boolean;
  foods: FoodItem[];
  totalEstimatedCalories: number;
  confidence: "low" | "medium" | "high";
  notes: string;
}

export type ScanFoodResult = { ok: true; data: FoodScanResult } | { ok: false; error: string };

/**
 * Sends a compressed image to the food-scan Edge Function — the only place
 * Gemini's multimodal endpoint is called. The frontend never talks to
 * Gemini directly and never sees GEMINI_API_KEY.
 */
export async function scanFood(image: CompressedImage): Promise<ScanFoodResult> {
  if (!supabase) {
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await supabase.functions.invoke<FoodScanResult & { error?: string }>(
      "food-scan",
      {
        body: { imageBase64: image.base64, mimeType: image.mimeType },
      },
    );

    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 429) {
        return {
          ok: false,
          error: "We're receiving a high number of scans right now. Please try again shortly.",
        };
      }
      if (status === 403) {
        return { ok: false, error: MEMBERSHIP_REQUIRED_MESSAGE };
      }
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    if (!data || !Array.isArray(data.foods)) {
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    return {
      ok: true,
      data: {
        foodDetected: Boolean(data.foodDetected),
        foods: data.foods,
        totalEstimatedCalories: data.totalEstimatedCalories ?? 0,
        confidence: data.confidence ?? "low",
        notes: data.notes ?? "",
      },
    };
  } catch {
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }
}
