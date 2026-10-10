"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LEAD_STATUSES, canTransition, requiresReason, type LeadStatus } from "@/features/leads";
import { LOST_REASON_KEYS, type LeadStatusKey } from "../model/admin-lead";

const ERROR_KEYS = [
  "unauthorized",
  "forbidden",
  "invalid_input",
  "transition_not_allowed",
  "reason_required",
  "invalid_note",
  "not_found",
  "rate_limited",
] as const;

async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return null;
    const data = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    return data?.error?.code ?? "internal_error";
  } catch {
    return "internal_error";
  }
}

function useErrorText() {
  const t = useTranslations("admin.errors");
  return (code: string) => ((ERROR_KEYS as readonly string[]).includes(code) ? t(code) : t("internal_error"));
}

/** Status buttons: only the transitions the domain allows. Losing a lead asks for a reason first. */
export function StatusActions({
  leadId,
  status,
  demo,
}: {
  leadId: string;
  status: LeadStatusKey;
  demo: boolean;
}) {
  const t = useTranslations("admin.lead");
  const s = useTranslations("admin.status");
  const lr = useTranslations("admin.lostReasons");
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState<LeadStatus | null>(null);
  const [askingLost, setAskingLost] = useState(false);
  const [reason, setReason] = useState<string>(LOST_REASON_KEYS[0]);
  const [error, setError] = useState("");

  const moves = LEAD_STATUSES.filter((to) => canTransition(status, to));

  async function move(to: LeadStatus, withReason?: string) {
    setError("");
    setPending(to);
    const code = await post(`/api/admin/leads/${leadId}/status`, { to, reason: withReason ?? "" });
    setPending(null);
    if (code) return setError(errorText(code));
    setAskingLost(false);
    router.refresh();
  }

  if (moves.length === 0) return <p className="text-text-muted">{t("noMoves")}</p>;

  return (
    <div className="grid gap-3">
      <p className="text-[14px] text-text-muted">{t("moveTo")}</p>
      <div className="flex flex-wrap gap-2">
        {moves.map((to) => (
          <button
            key={to}
            type="button"
            disabled={demo || pending !== null}
            onClick={() => (requiresReason(to) ? setAskingLost(true) : move(to))}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-surface-line bg-surface ps-4 pe-4 text-[14px] font-semibold hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === to ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
            {s(to)}
          </button>
        ))}
      </div>

      {askingLost ? (
        <div className="grid gap-2 rounded-xl bg-danger/5 p-4">
          <label className="text-[14px] font-semibold text-danger" htmlFor="lost-reason">
            {t("lostReason")}
          </label>
          <p className="text-[13px] text-text-muted">{t("lostReasonHint")}</p>
          <select
            id="lost-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-surface-line bg-surface ps-3 pe-3 text-base"
          >
            {LOST_REASON_KEYS.map((key) => (
              <option key={key} value={key}>
                {lr(key)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={demo || pending !== null}
              onClick={() => move("lost", reason)}
              className="inline-flex min-h-10 items-center rounded-lg bg-danger ps-4 pe-4 text-[14px] font-semibold text-surface disabled:opacity-50"
            >
              {t("confirm")}
            </button>
            <button
              type="button"
              onClick={() => setAskingLost(false)}
              className="inline-flex min-h-10 items-center rounded-lg border border-surface-line ps-4 pe-4 text-[14px] font-semibold"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {demo ? <p className="text-[13px] text-text-muted">{t("demoActions")}</p> : null}
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function NoteForm({ leadId, demo }: { leadId: string; demo: boolean }) {
  const t = useTranslations("admin.lead");
  const errorText = useErrorText();
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setSaving(true);
    const code = await post(`/api/admin/leads/${leadId}/notes`, { text });
    setSaving(false);
    if (code) return setError(errorText(code));
    setText("");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-[15px] font-semibold">
        {t("addNote")}
        <textarea
          rows={3}
          value={text}
          maxLength={2000}
          disabled={demo}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("notePlaceholder")}
          className="w-full rounded-xl border border-surface-line bg-surface p-4 text-base font-normal focus-visible:border-brand-strong disabled:opacity-50"
        />
        <span className="text-[14px] font-normal text-text-muted">{t("noteHint")}</span>
      </label>
      <button
        type="button"
        disabled={demo || saving || text.trim() === ""}
        onClick={save}
        className="inline-flex min-h-11 items-center justify-self-start rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <Loader2 className="me-2 size-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
        {t("save")}
      </button>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
