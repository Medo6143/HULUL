"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { FIELD } from "./showcase-shared";

export interface UploadedImage {
  url: string;
  alt: { ar: string; en: string };
}

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface SignResponse {
  ok?: boolean;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  folder?: string;
  allowedFormats?: string;
  signature?: string;
  error?: { code?: string };
}

/** Uploads straight from the browser to Cloudinary with a signature from our server; the secret never reaches the page. */
type UploadResult = { url?: string; error?: "not_configured" | "failed" };

async function uploadOne(file: File): Promise<UploadResult> {
  const signResponse = await fetch("/api/admin/uploads/sign", { method: "POST" });
  const sign = (await signResponse.json().catch(() => null)) as SignResponse | null;
  if (!signResponse.ok || !sign?.signature) {
    return { error: sign?.error?.code === "not_configured" ? "not_configured" : "failed" };
  }
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey ?? "");
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder ?? "");
  body.append("allowed_formats", sign.allowedFormats ?? "");
  body.append("signature", sign.signature);
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
  const data = (await upload.json().catch(() => null)) as { secure_url?: string } | null;
  return upload.ok && data?.secure_url ? { url: data.secure_url } : { error: "failed" };
}

export function ImageUploader({
  images,
  onChange,
  disabled,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations("admin.caseStudies.images");
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const picked = Array.from(files).slice(0, MAX_IMAGES - images.length);
    const next = [...images];
    setUploading(true);
    for (const file of picked) {
      if (!TYPES.includes(file.type)) {
        setError(t("badType"));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(t("tooLarge"));
        continue;
      }
      const result: UploadResult = await uploadOne(file).catch((): UploadResult => ({ error: "failed" }));
      if (result.url) next.push({ url: result.url, alt: { ar: "", en: "" } });
      else setError(result.error === "not_configured" ? t("notConfigured") : t("failed"));
    }
    setUploading(false);
    onChange(next);
    if (input.current) input.current.value = "";
  }

  const setAlt = (index: number, value: string) =>
    onChange(images.map((image, i) => (i === index ? { ...image, alt: { ...image.alt, ar: value } } : image)));

  return (
    <div className="grid gap-3 md:col-span-2">
      <div>
        <p className="text-[15px] font-semibold">{t("title")}</p>
        <p className="text-[13px] text-text-muted">{t("hint", { max: MAX_IMAGES })}</p>
      </div>
      {images.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.url} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 rounded-xl border border-surface-line p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted">
                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="grid gap-1">
                {index === 0 ? <span className="text-[12px] font-semibold text-brand-strong">{t("cover")}</span> : null}
                <input
                  aria-label={t("alt")}
                  placeholder={t("alt")}
                  maxLength={150}
                  value={image.alt.ar}
                  disabled={disabled}
                  onChange={(e) => setAlt(index, e.target.value)}
                  className={FIELD}
                />
              </div>
              <button
                type="button"
                aria-label={t("remove")}
                disabled={disabled}
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="grid size-10 place-items-center rounded-lg border border-surface-line text-text-muted hover:border-danger hover:text-danger disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept={TYPES.join(",")}
          multiple
          className="sr-only"
          id="case-images"
          disabled={disabled || uploading || images.length >= MAX_IMAGES}
          onChange={(e) => onFiles(e.target.files)}
        />
        <label
          htmlFor="case-images"
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 font-semibold hover:border-ink-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
        >
          {uploading ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {uploading ? t("uploading") : t("add")}
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
