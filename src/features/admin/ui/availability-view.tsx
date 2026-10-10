"use client";

import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FIELD, Field, callApi } from "./showcase-shared";

type Window = { start: string; end: string };

export interface AvailabilityData {
  slotMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  meetingLink: string;
  weekly: Window[][];
}
export interface ExceptionRow {
  date: string;
  closed: boolean;
  windows: Window[];
}

const ERROR_CODES = ["invalid_availability", "invalid_date", "invalid_input", "unauthorized", "forbidden"];
const TIME = "min-h-11 rounded-lg border border-surface-line bg-surface ps-3 pe-3 text-base focus-visible:border-brand-strong disabled:opacity-50";

export function AvailabilityView({
  initial,
  exceptions,
  demo,
}: {
  initial: AvailabilityData;
  exceptions: ExceptionRow[];
  demo: boolean;
}) {
  const t = useTranslations("admin.availability");
  const router = useRouter();
  const [data, setData] = useState<AvailabilityData>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [exDate, setExDate] = useState("");
  const [exClosed, setExClosed] = useState(true);
  const [exWindow, setExWindow] = useState<Window>({ start: "09:00", end: "12:00" });

  const errorText = (code?: string) => (ERROR_CODES.includes(code ?? "") ? t(`errors.${code}`) : t("errors.generic"));
  const setNum = (key: "slotMinutes" | "bufferMinutes" | "minNoticeHours" | "maxDaysAhead", value: string) =>
    setData((d) => ({ ...d, [key]: Number(value) || 0 }));
  const setWindow = (day: number, index: number, key: keyof Window, value: string) =>
    setData((d) => ({
      ...d,
      weekly: d.weekly.map((windows, i) => (i === day ? windows.map((w, j) => (j === index ? { ...w, [key]: value } : w)) : windows)),
    }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await callApi("/api/admin/availability", "PUT", data);
    setBusy(false);
    setMessage(result.ok ? { ok: true, text: t("saved") } : { ok: false, text: errorText(result.code) });
    if (result.ok) router.refresh();
  }

  async function addException() {
    setBusy(true);
    setMessage(null);
    const result = await callApi(`/api/admin/availability/exceptions/${exDate}`, "PUT", {
      closed: exClosed,
      windows: exClosed ? [] : [exWindow],
    });
    setBusy(false);
    if (!result.ok) return setMessage({ ok: false, text: errorText(result.code) });
    setExDate("");
    router.refresh();
  }

  async function removeException(date: string) {
    setBusy(true);
    const result = await callApi(`/api/admin/availability/exceptions/${date}`, "DELETE");
    setBusy(false);
    if (!result.ok) return setMessage({ ok: false, text: errorText(result.code) });
    router.refresh();
  }

  const disabled = demo || busy;

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-text-muted">{t("subtitle")}</p>
      </div>

      <form onSubmit={save} className="grid gap-6 rounded-2xl border border-surface-line bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label={t("slotMinutes")}>
            <input type="number" min={15} max={240} step={5} value={data.slotMinutes} disabled={disabled} onChange={(e) => setNum("slotMinutes", e.target.value)} className={FIELD} />
          </Field>
          <Field label={t("bufferMinutes")}>
            <input type="number" min={0} max={120} step={5} value={data.bufferMinutes} disabled={disabled} onChange={(e) => setNum("bufferMinutes", e.target.value)} className={FIELD} />
          </Field>
          <Field label={t("minNoticeHours")} hint={t("minNoticeHint")}>
            <input type="number" min={0} max={720} value={data.minNoticeHours} disabled={disabled} onChange={(e) => setNum("minNoticeHours", e.target.value)} className={FIELD} />
          </Field>
          <Field label={t("maxDaysAhead")}>
            <input type="number" min={1} max={90} value={data.maxDaysAhead} disabled={disabled} onChange={(e) => setNum("maxDaysAhead", e.target.value)} className={FIELD} />
          </Field>
        </div>
        <Field label={t("meetingLink")} hint={t("meetingLinkHint")}>
          <input
            type="url"
            dir="ltr"
            placeholder="https://meet.google.com/..."
            value={data.meetingLink}
            disabled={disabled}
            onChange={(e) => setData((d) => ({ ...d, meetingLink: e.target.value }))}
            className={FIELD}
          />
        </Field>

        <fieldset className="grid gap-3">
          <legend className="text-[17px] font-bold">{t("weekly")}</legend>
          <p className="text-[14px] text-text-muted">{t("weeklyHint")}</p>
          {data.weekly.map((windows, day) => (
            <div key={day} className="grid gap-2 rounded-xl border border-surface-line p-4 md:grid-cols-[140px_1fr] md:items-start">
              <b className="pt-2">{t(`days.${day}`)}</b>
              <div className="grid gap-2">
                {windows.length === 0 ? <span className="pt-2 text-[14px] text-text-muted">{t("closed")}</span> : null}
                {windows.map((w, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2" dir="ltr">
                    <input type="time" aria-label={t("from")} value={w.start} disabled={disabled} onChange={(e) => setWindow(day, index, "start", e.target.value)} className={TIME} />
                    <span aria-hidden="true">-</span>
                    <input type="time" aria-label={t("to")} value={w.end} disabled={disabled} onChange={(e) => setWindow(day, index, "end", e.target.value)} className={TIME} />
                    <button
                      type="button"
                      aria-label={t("removeWindow")}
                      disabled={disabled}
                      onClick={() => setData((d) => ({ ...d, weekly: d.weekly.map((ws, i) => (i === day ? ws.filter((_, j) => j !== index) : ws)) }))}
                      className="grid size-10 place-items-center rounded-lg border border-surface-line text-text-muted hover:border-danger hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {windows.length < 4 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setData((d) => ({ ...d, weekly: d.weekly.map((ws, i) => (i === day ? [...ws, { start: "09:00", end: "12:00" }] : ws)) }))}
                    className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t("addWindow")}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {t("save")}
          </button>
          <p className="text-[14px] text-text-muted">{t("timezoneNote")}</p>
        </div>
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-success" : "text-danger"}>
            {message.text}
          </p>
        ) : null}
      </form>

      <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <div>
          <h2 className="text-[18px] font-bold">{t("exceptions")}</h2>
          <p className="text-[14px] text-text-muted">{t("exceptionsHint")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("date")}>
            <input type="date" dir="ltr" value={exDate} disabled={disabled} onChange={(e) => setExDate(e.target.value)} className={FIELD} />
          </Field>
          <label className="flex min-h-12 items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" checked={exClosed} disabled={disabled} onChange={(e) => setExClosed(e.target.checked)} className="size-5" />
            {t("closedAllDay")}
          </label>
          {!exClosed ? (
            <div className="flex items-center gap-2" dir="ltr">
              <input type="time" aria-label={t("from")} value={exWindow.start} disabled={disabled} onChange={(e) => setExWindow((w) => ({ ...w, start: e.target.value }))} className={TIME} />
              <span aria-hidden="true">-</span>
              <input type="time" aria-label={t("to")} value={exWindow.end} disabled={disabled} onChange={(e) => setExWindow((w) => ({ ...w, end: e.target.value }))} className={TIME} />
            </div>
          ) : null}
          <button
            type="button"
            disabled={disabled || exDate === ""}
            onClick={addException}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-surface-line ps-5 pe-5 font-semibold hover:border-ink-900 disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("addException")}
          </button>
        </div>
        {exceptions.length === 0 ? (
          <p className="text-[14px] text-text-muted">{t("noExceptions")}</p>
        ) : (
          <ul className="grid gap-2">
            {exceptions.map((e) => (
              <li key={e.date} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-line p-3">
                <span dir="ltr" className="font-semibold tabular-nums">
                  {e.date}
                </span>
                <span className="text-[14px] text-text-muted" dir="ltr">
                  {e.closed ? t("closed") : e.windows.map((w) => `${w.start} - ${w.end}`).join(" | ")}
                </span>
                <button
                  type="button"
                  aria-label={t("removeException")}
                  disabled={disabled}
                  onClick={() => removeException(e.date)}
                  className="grid size-10 place-items-center rounded-lg border border-surface-line text-text-muted hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
    </div>
  );
}
