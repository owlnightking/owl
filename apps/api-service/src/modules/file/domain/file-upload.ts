import { randomUUID } from "node:crypto";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const KILOBYTES_PER_MEGABYTE = 1024;
const BYTES_PER_KILOBYTE = 1024;

export const MAX_IMAGE_BYTES = 5 * KILOBYTES_PER_MEGABYTE * BYTES_PER_KILOBYTE;
export const DEFAULT_IMAGE_BUCKET = "images";
export const IMAGE_OBJECT_PREFIX = "uploads";

export function isSupportedImage(mimeType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function buildImageObjectKey(ownerId: string, mimeType: string): string {
  const extension = IMAGE_EXTENSIONS[mimeType] ?? "bin";
  return `${IMAGE_OBJECT_PREFIX}/${ownerId}/${randomUUID()}.${extension}`;
}
