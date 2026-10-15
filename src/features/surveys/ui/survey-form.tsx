"use client";

import { Check, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

const SERVER_ERRORS = ["invalid_rating", "comment_invalid", "already_answered", "not_found", "rate_limited", "invalid_input"] as const;

/** The public survey form: a star rating, a comment, an optional name and role, and an opt-in to publish. */
export function SurveyForm({ token, clientName, answered }: { token: string; clientName: string; answered: boolean }) {
  const t = useTranslations("survey");
  const locale = useLocale();
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(clientName);
  const [role, setRole] = useState("");
  const [allowPublish, setAllowPublish] = useState(false); // always starts unchecked
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"editing" | "sending" | "done" | "failed">(answered ? "done" : "editing");
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});
  const [serverError, setServerError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (rating < 1) found.rating = t("errors.rating");
    if (comment.trim().length < 5) found.comment = t("errors.comment");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");
    try {
      const response = await fetch(`/api/survey/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, name, role, allowPublish, website }),
      });
      if (response.ok) {
        setStatus("done");
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
      const code = body?.error?.code as (typeof SERVER_ERRORS)[number] | undefined;
      setServerError(code && SERVER_ERRORS.includes(code) ? t(`serverErrors.${code}`) : t("failed"));
      setStatus("failed");
    } catch {
      setServerError(t("failed"));
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="grid justify-items-center gap-4 py-8 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          {answered ? t("alreadyTitle") : t("thanksTitle")}
        </h2>
        <p className="max-w-md text-text-muted">{answered ? t("alreadyBody") : t("thanksBody")}</p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6" lang={locale}>
      <fieldset className="grid gap-3" aria-describedby={errors.rating ? "rating-error" : undefined}>
        <legend className="mb-1 text-[16px] font-semibold">{t("ratingLabel")}</legend>
        <div className="flex items-center gap-1" dir="ltr" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" aria-label={t("starLabel", { n })} />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-11 motion-safe:transition peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink-950",
                  n <= shown ? "fill-warning text-warning" : "text-surface-line",
                )}
              />
            </label>
          ))}
        </div>
        {rating > 0 ? <p className="text-[15px] font-semibold text-text-muted">{t(`rating.${rating}`)}</p> : null}
        {errors.rating ? (
          <p id="rating-error" role="alert" className="text-[15px] text-danger">
            {errors.rating}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-2">
        <Textarea label={t("comment")} hint={t("commentHint")} value={comment} maxLength={1000} rows={5} onChange={(e) => setComment(e.target.value)} />
        {errors.comment ? (
          <p role="alert" className="text-[15px] text-danger">
            {errors.comment}
          </p>
        ) : null}
      </div>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Input label={t("name")} autoComplete="name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
        <Input label={t("role")} hint={t("roleHint")} value={role} maxLength={100} onChange={(e) => setRole(e.target.value)} />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -z-10 h-0 w-0 overflow-hidden opacity-0">
        <label>
          website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-control border border-surface-line bg-surface-muted p-4 text-[15px] leading-[1.7]">
        <input type="checkbox" checked={allowPublish} onChange={(e) => setAllowPublish(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--brand-strong)]" />
        <span>
          <b className="block">{t("publishLabel")}</b>
          <span className="text-text-muted">{t("publishHint")}</span>
        </span>
      </label>

      {status === "failed" ? (
        <p role="alert" className="rounded-control border border-danger p-4 text-danger">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" loading={status === "sending"} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
