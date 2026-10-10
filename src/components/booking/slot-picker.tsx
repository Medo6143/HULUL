"use client";

import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface Slot {
  startUtc: string;
  time: string;
}
interface Day {
  date: string;
  slots: Slot[];
}

const DAYS_AHEAD = 14;

/**
 * Optional time picker for consultations. It asks the server for open times and renders nothing at all when
 * there are none (no schedule set yet, or the request failed), so the form keeps working without it.
 */
export function SlotPicker({
  value,
  onChange,
  refreshKey = 0,
}: {
  value: string | null;
  onChange: (startUtc: string | null) => void;
  /** Change this to re-fetch (after a "time already taken" answer). */
  refreshKey?: number;
}) {
  const t = useTranslations("start.booking");
  const locale = useLocale() === "en" ? "en" : "ar";
  const [days, setDays] = useState<Day[]>([]);
  const [activeDate, setActiveDate] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/slots?days=${DAYS_AHEAD}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ok?: boolean; days?: Day[] } | null) => {
        if (cancelled) return;
        const list = data?.ok && Array.isArray(data.days) ? data.days : [];
        setDays(list);
        setActiveDate((current) => (list.some((d) => d.date === current) ? current : (list[0]?.date ?? "")));
      })
      .catch(() => {
        if (!cancelled) setDays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (days.length === 0) return null;

  const intlLocale = locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
  const dayLabel = (date: string) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Riyadh" }).format(
      new Date(`${date}T12:00:00+03:00`),
    );
  const active = days.find((d) => d.date === activeDate) ?? days[0]!;

  return (
    <fieldset className="grid gap-3 rounded-card border border-surface-line bg-surface-muted p-5">
      <legend className="flex items-center gap-2 ps-2 pe-2 text-[15px] font-semibold">
        <CalendarDays className="size-5 text-brand-strong" aria-hidden="true" />
        {t("title")}
      </legend>
      <p className="text-[14px] text-text-muted">{t("hint")}</p>

      <div role="tablist" aria-label={t("days")} className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            role="tab"
            aria-selected={day.date === active.date}
            onClick={() => setActiveDate(day.date)}
            className={cn(
              "min-h-11 shrink-0 rounded-control border ps-4 pe-4 text-[15px] font-semibold",
              day.date === active.date ? "border-brand-strong bg-brand-soft text-ink-900" : "border-surface-line bg-surface hover:border-text-muted/40",
            )}
          >
            {dayLabel(day.date)}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label={t("times")} className="grid grid-cols-3 gap-2 md:grid-cols-4">
        {active.slots.map((slot) => {
          const selected = value === slot.startUtc;
          return (
            <button
              key={slot.startUtc}
              type="button"
              role="radio"
              aria-checked={selected}
              dir="ltr"
              onClick={() => onChange(selected ? null : slot.startUtc)}
              className={cn(
                "min-h-11 rounded-control border text-[15px] font-semibold",
                selected ? "border-brand-strong bg-brand text-ink-950" : "border-surface-line bg-surface hover:border-text-muted/40",
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-text-muted">{t("timezone")}</p>
    </fieldset>
  );
}
