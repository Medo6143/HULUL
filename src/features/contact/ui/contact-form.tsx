"use client";

import { Check, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCaptchaToken } from "@/lib/recaptcha-client";
import { MESSAGE_MIN } from "../domain/contact-message";

const SERVER_ERRORS = [
  "invalid_json",
  "payload_too_large",
  "rate_limited",
  "invalid_input",
  "invalid_name",
  "invalid_email",
  "invalid_message",
  "consent_required",
  "bot_suspected",
] as const;

type Status = "editing" | "sending" | "sent" | "failed";
type Errors = Partial<Record<"name" | "email" | "message" | "consent", string>>;

export function ContactForm() {
  const t = useTranslations("contactForm");
  const tf = useTranslations("form");
  const locale = useLocale() === "en" ? "en" : "ar";
  const successRef = useRef<HTMLHeadingElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false); // always starts unchecked
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("editing");
  const [serverError, setServerError] = useState("");

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = tf("errors.required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t("emailInvalid");
    if (message.trim().length < MESSAGE_MIN) next.message = t("messageShort");
    if (!consent) next.consent = t("consentRequired");
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");
    const captcha = await getCaptchaToken("contact");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, locale, consent: true, website, captcha }),
      });
      if (response.ok) {
        setStatus("sent");
        requestAnimationFrame(() => successRef.current?.focus());
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

  if (status === "sent") {
    return (
      <div role="status" className="grid content-center gap-4 py-6">
        <span className="grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="text-2xl font-bold text-text outline-none">
          {t("success.title")}
        </h3>
        <p className="text-text-muted">{t("success.body")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div>
        <h3 className="text-[22px] font-bold leading-[1.4]">{t("title")}</h3>
        <p className="mt-1 text-[15px] text-text-muted">{t("intro")}</p>
      </div>
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <Input
          label={t("name")}
          autoComplete="name"
          value={name}
          maxLength={100}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t("email")}
          type="email"
          autoComplete="email"
          ltr
          value={email}
          maxLength={200}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Textarea
          label={t("message")}
          value={message}
          maxLength={2000}
          rows={5}
          aria-invalid={errors.message ? true : undefined}
          onChange={(e) => setMessage(e.target.value)}
        />
        {errors.message ? (
          <p role="alert" className="mt-2 text-[15px] text-danger">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -z-10 h-0 w-0 overflow-hidden opacity-0">
        <label>
          website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 text-[15px] leading-[1.7] text-text-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-1 size-5 shrink-0 accent-[var(--brand-strong)]"
          />
          <span>{t("consent")}</span>
        </label>
        {errors.consent ? (
          <p role="alert" className="text-[15px] text-danger">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {status === "failed" ? (
        <p role="alert" className="rounded-control border border-danger p-4 text-danger">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" loading={status === "sending"} className="w-full sm:w-auto sm:justify-self-start">
        <Send className="size-5 rtl:-scale-x-100" aria-hidden="true" />
        {t("submit")}
      </Button>
    </form>
  );
}
