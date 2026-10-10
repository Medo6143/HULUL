"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export const FIELD =
  "min-h-12 w-full rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-base focus-visible:border-brand-strong disabled:opacity-50";
export const AREA =
  "w-full rounded-xl border border-surface-line bg-surface p-4 text-base leading-[1.7] focus-visible:border-brand-strong disabled:opacity-50";

const ERROR_KEYS = [
  "invalid_input",
  "invalid_slug",
  "slug_exists",
  "consent_required",
  "consent_note_required",
  "not_found",
  "unauthorized",
  "forbidden",
] as const;

export interface ApiResult {
  ok: boolean;
  code?: string;
}

/** One JSON call to an admin API route, reduced to ok or an error code. */
export async function callApi(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    return { ok: false, code: data?.error?.code ?? "internal_error" };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

export function useShowcaseErrors() {
  const t = useTranslations("admin.showcase");
  return (code?: string) =>
    (ERROR_KEYS as readonly string[]).includes(code ?? "") ? t(`errors.${code}`) : t("errors.internal_error");
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2 text-[15px] font-semibold">
      {label}
      {children}
      {hint ? <span className="text-[13px] font-normal text-text-muted">{hint}</span> : null}
    </label>
  );
}

/** The consent block both forms share: the record of how permission was obtained, and the publish switch. */
export function ConsentFields(props: {
  consent: boolean;
  note: string;
  published: boolean;
  disabled: boolean;
  onConsent: (value: boolean) => void;
  onNote: (value: string) => void;
  onPublished: (value: boolean) => void;
}) {
  const t = useTranslations("admin.showcase");
  return (
    <fieldset className="grid gap-4 rounded-xl border border-surface-line bg-surface-muted p-4">
      <legend className="ps-2 pe-2 text-[15px] font-bold">{t("consentTitle")}</legend>
      <label className="flex items-start gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={props.consent}
          disabled={props.disabled}
          onChange={(e) => props.onConsent(e.target.checked)}
          className="mt-1 size-5"
        />
        <span>
          <b>{t("consentLabel")}</b>
          <span className="block text-[13px] text-text-muted">{t("consentHint")}</span>
        </span>
      </label>
      {props.consent ? (
        <Field label={t("consentNote")} hint={t("consentNoteHint")}>
          <input
            value={props.note}
            maxLength={500}
            disabled={props.disabled}
            onChange={(e) => props.onNote(e.target.value)}
            className={FIELD}
          />
        </Field>
      ) : null}
      <label className="flex items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={props.published && props.consent}
          disabled={props.disabled || !props.consent}
          onChange={(e) => props.onPublished(e.target.checked)}
          className="size-5"
        />
        <b>{t("publishLabel")}</b>
      </label>
      {!props.consent ? <p className="text-[13px] text-text-muted">{t("needsConsent")}</p> : null}
    </fieldset>
  );
}

export function StatusBadge({ published, consent }: { published: boolean; consent: boolean }) {
  const t = useTranslations("admin.showcase");
  const [text, tone] = published
    ? [t("status.published"), "bg-success/10 text-success"]
    : consent
      ? [t("status.draft"), "bg-warning/10 text-warning"]
      : [t("status.noConsent"), "bg-danger/10 text-danger"];
  return (
    <span className={`inline-flex items-center rounded-full ps-3 pe-3 py-1 text-[13px] font-semibold ${tone}`}>
      {text}
    </span>
  );
}
