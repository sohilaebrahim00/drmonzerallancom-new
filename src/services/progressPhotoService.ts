import { supabase } from "@/lib/supabase";
import { getDemoMode } from "@/dev/demoMode";

export interface ProgressPhoto {
  id: string;
  image_path: string;
  taken_at: string;
  shared_with_doctor: boolean;
  notes: string | null;
  url: string | null;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function signUrls(paths: string[]): Promise<Map<string, string>> {
  if (!supabase || paths.length === 0) return new Map();
  const { data } = await supabase.storage.from("progress-photos").createSignedUrls(paths, 60 * 60);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}

export async function getMyProgressPhotos(): Promise<ProgressPhoto[]> {
  if (getDemoMode()) return [];
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, image_path, taken_at, shared_with_doctor, notes")
    .order("taken_at", { ascending: false });
  if (error || !data) return [];

  const urls = await signUrls(data.map((p) => p.image_path));
  return data.map((p) => ({ ...p, url: urls.get(p.image_path) ?? null }));
}

export async function uploadProgressPhoto(
  dataUrl: string,
  sharedWithDoctor: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getDemoMode()) return { ok: false, error: "Photo upload is disabled in the demo preview." };
  if (!supabase) return { ok: false, error: "Not connected." };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) return { ok: false, error: "Could not upload photo." };

  const { error } = await supabase.from("progress_photos").insert({
    user_id: userId,
    image_path: path,
    shared_with_doctor: sharedWithDoctor,
  });
  if (error) return { ok: false, error: "Photo uploaded, but could not be saved." };
  return { ok: true };
}

export async function deleteProgressPhoto(id: string, imagePath: string): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  await supabase.from("progress_photos").delete().eq("id", id);
  await supabase.storage.from("progress-photos").remove([imagePath]);
}

export async function setProgressPhotoSharing(id: string, shared: boolean): Promise<void> {
  if (getDemoMode()) return;
  if (!supabase) return;
  await supabase.from("progress_photos").update({ shared_with_doctor: shared }).eq("id", id);
}
