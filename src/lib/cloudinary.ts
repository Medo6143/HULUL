import { createHash } from "node:crypto";

/** Folder every admin upload goes into; the sign route never signs another folder. */
export const CLOUDINARY_FOLDER = "hulol/work";
export const CLOUDINARY_FORMATS = "jpg,jpeg,png,webp,avif";

/**
 * Cloudinary signed uploads: sha1 of the parameters sorted by name and joined as `key=value&...`, followed by the
 * API secret. The secret stays on the server; the browser only gets the resulting signature.
 */
export function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}
