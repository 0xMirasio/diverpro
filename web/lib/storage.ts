import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const uploadRoot = process.env.UPLOAD_DIR || join(process.cwd(), "data", "uploads");

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const acceptedImageTypes = Object.keys(extensions);
export const maxImageBytes = 5 * 1024 * 1024;
export const maxAvatarImageBytes = 300 * 1024;

export function mediaStorageKey(userId: string, mimeType: string) {
  return `${userId}/${crypto.randomUUID()}.${extensions[mimeType]}`;
}

export async function saveMedia(storageKey: string, bytes: Uint8Array) {
  const path = join(/* turbopackIgnore: true */ uploadRoot, storageKey);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { flag: "wx" });
}

export function readMedia(storageKey: string) {
  return readFile(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ uploadRoot, storageKey));
}

export function deleteMedia(storageKey: string) {
  return rm(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ uploadRoot, storageKey), { force: true });
}
