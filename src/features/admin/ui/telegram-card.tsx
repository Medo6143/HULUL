"use client";

import { Check, ExternalLink, Loader2, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FIELD, callApi } from "./showcase-shared";

export interface TelegramSettings {
  configured: boolean;
  botUsername: string | null;
  chats: { id: string; name: string }[];
  usingEnvChat: boolean;
}

const MAX = 10;
const ERRORS = ["invalid_chat_id", "too_many", "invalid_input", "unauthorized", "forbidden"];

/** Owner manages who receives Telegram alerts: add chats by hand or discover the people who started the bot. */
export function TelegramCard({ telegram, demo }: { telegram: TelegramSettings; demo: boolean }) {
  const t = useTranslations("admin.telegram");
  const router = useRouter();
  const [rows, setRows] = useState<{ id: string; name: string }[]>(telegram.chats.length > 0 ? telegram.chats : []);
  const [found, setFound] = useState<{ id: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const saved = new Set(telegram.chats.map((chat) => chat.id));

  const setAt = (index: number, patch: Partial<{ id: string; name: string }>) => setRows((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function save() {
    setBusy("save");
    setMessage(null);
    const result = await callApi("/api/admin/settings/telegram", "PUT", { chats: rows });
    setBusy(null);
    if (!result.ok) {
      const code = result.code ?? "";
      return setMessage({ ok: false, text: ERRORS.includes(code) ? t(`errors.${code}`) : t("errors.generic") });
    }
    setMessage({ ok: true, text: t("saved") });
    router.refresh();
  }

  async function discover() {
    setBusy("discover");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings/telegram/discover");
      const body = (await response.json().catch(() => null)) as { chats?: { id: string; name: string }[]; error?: { code?: string } } | null;
      if (!response.ok) {
        const code = body?.error?.code;
        return setMessage({ ok: false, text: code === "not_configured" ? t("errors.not_configured") : t("errors.unreachable") });
      }
      setFound((body?.chats ?? []).filter((chat) => !rows.some((row) => row.id === chat.id)));
    } catch {
      setMessage({ ok: false, text: t("errors.unreachable") });
    } finally {
      setBusy(null);
    }
  }

  async function test(id: string) {
    setBusy(`test-${id}`);
    setMessage(null);
    const result = await callApi("/api/admin/settings/telegram/test", "POST", { chatId: id });
    setBusy(null);
    setMessage(result.ok ? { ok: true, text: t("testSent") } : { ok: false, text: t("errors.testFailed") });
  }

  const disabled = demo || busy !== null;

  return (
    <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
      <div>
        <h2 className="text-[18px] font-bold">{t("title")}</h2>
        <p className="text-[15px] text-text-muted">{t("hint")}</p>
      </div>

      {!telegram.configured ? (
        <div className="grid gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-[15px]">
          <b>{t("notConfiguredTitle")}</b>
          <ol className="grid list-decimal gap-1 ps-5 text-text-muted">
            <li>{t("setup1")}</li>
            <li>{t("setup2")}</li>
            <li>
              {t("setup3")} <code dir="ltr">TELEGRAM_BOT_TOKEN</code>
            </li>
            <li>{t("setup4")}</li>
          </ol>
        </div>
      ) : (
        <div className="grid gap-2 rounded-xl bg-surface-muted p-4 text-[15px]">
          <p>
            {t("bot")}{" "}
            {telegram.botUsername ? (
              <a href={`https://t.me/${telegram.botUsername}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-strong underline" dir="ltr">
                @{telegram.botUsername}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-text-muted">{t("botUnknown")}</span>
            )}
          </p>
          <p className="text-text-muted">{t("howToJoin")}</p>
        </div>
      )}

      {telegram.usingEnvChat ? <p className="rounded-xl bg-brand-soft p-3 text-[14px]">{t("usingEnv")}</p> : null}

      <ul className="grid gap-3">
        {rows.length === 0 ? <li className="text-[15px] text-text-muted">{t("noChats")}</li> : null}
        {rows.map((row, index) => (
          <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
            <input aria-label={t("name")} placeholder={t("name")} maxLength={60} value={row.name} disabled={demo} onChange={(e) => setAt(index, { name: e.target.value })} className={FIELD} />
            <input aria-label={t("chatId")} placeholder={t("chatId")} dir="ltr" inputMode="numeric" maxLength={30} value={row.id} disabled={demo} onChange={(e) => setAt(index, { id: e.target.value })} className={FIELD} />
            <button
              type="button"
              disabled={disabled || !saved.has(row.id) || !telegram.configured}
              onClick={() => test(row.id)}
              title={saved.has(row.id) ? undefined : t("saveFirst")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-40"
            >
              {busy === `test-${row.id}` ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              {t("test")}
            </button>
            <button
              type="button"
              aria-label={t("remove")}
              disabled={demo}
              onClick={() => setRows((list) => list.filter((_, i) => i !== index))}
              className="grid size-12 place-items-center rounded-xl border border-surface-line text-text-muted hover:border-danger hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || rows.length >= MAX}
          onClick={() => setRows((list) => [...list, { id: "", name: "" }])}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 font-semibold hover:border-ink-900 disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("add")}
        </button>
        <button
          type="button"
          disabled={disabled || !telegram.configured}
          onClick={discover}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 font-semibold hover:border-ink-900 disabled:opacity-50"
        >
          {busy === "discover" ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
          {t("discover")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={save}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          {t("save")}
        </button>
      </div>

      {found ? (
        <div className="grid gap-2 rounded-xl border border-surface-line p-4">
          <b className="text-[15px]">{t("foundTitle")}</b>
          {found.length === 0 ? (
            <p className="text-[14px] text-text-muted">{t("foundNone")}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {found.map((chat) => (
                <li key={chat.id}>
                  <button
                    type="button"
                    disabled={rows.length >= MAX}
                    onClick={() => {
                      setRows((list) => [...list, chat]);
                      setFound((list) => (list ?? []).filter((c) => c.id !== chat.id));
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-strong ps-4 pe-4 text-[14px] font-semibold hover:bg-brand-soft"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {chat.name || chat.id}
                    <span className="text-text-muted" dir="ltr">
                      {chat.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[13px] text-text-muted">{t("foundHint")}</p>
        </div>
      ) : null}

      {message ? (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-success" : "text-danger"}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
