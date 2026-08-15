import { useEffect, useState } from "react";
import { Camera, Image, CircleNotch, Trash } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { EmptyState } from "@/app-native/components/EmptyState";
import { Switch } from "@/components/ui/switch";
import { capturePhoto, pickFromGallery } from "@/services/foodScanService";
import {
  deleteProgressPhoto,
  getMyProgressPhotos,
  setProgressPhotoSharing,
  uploadProgressPhoto,
  type ProgressPhoto,
} from "@/services/progressPhotoService";

export default function NativeProgressPhotos() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);

  function refresh() {
    getMyProgressPhotos().then((p) => {
      setPhotos(p);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  async function handleAdd(source: "camera" | "gallery") {
    const photo = source === "camera" ? await capturePhoto() : await pickFromGallery();
    if (!photo) return;
    setUploading(true);
    await uploadProgressPhoto(photo.dataUrl, false);
    setUploading(false);
    refresh();
  }

  return (
    <AppScreen title="Progress Photos" back className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
      <p className="text-sm text-muted-foreground">
        Private by default. Choose per-photo whether your doctor can see it — friends never can.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleAdd("camera")}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          <Camera className="h-4 w-4" /> Take Photo
        </button>
        <button
          type="button"
          onClick={() => handleAdd("gallery")}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          <Image className="h-4 w-4" /> From Gallery
        </button>
      </div>

      {uploading && (
        <div className="mt-4 flex justify-center">
          <CircleNotch className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex justify-center">
          <CircleNotch className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Camera}
            title="No progress photos yet"
            body="Add a photo to privately track how you're doing over time."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-app-surface"
            >
              {p.url && <img src={p.url} alt="" className="aspect-video w-full object-cover" />}
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.taken_at).toLocaleDateString()}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Switch
                      checked={p.shared_with_doctor}
                      onCheckedChange={(checked) => {
                        setProgressPhotoSharing(p.id, checked);
                        setPhotos((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, shared_with_doctor: checked } : x,
                          ),
                        );
                      }}
                    />
                    <span className="text-xs font-semibold text-navy">Visible to Doctor</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteProgressPhoto(p.id, p.image_path).then(refresh)}
                  aria-label="Delete photo"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppScreen>
  );
}
