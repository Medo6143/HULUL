"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { SlotPicker } from "@/components/booking/slot-picker";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/features/analytics";
import { cn } from "@/lib/cn";
import { getCaptchaToken } from "@/lib/recaptcha-client";
import { normalizePhone, type LeadService, type LeadType } from "../domain/lead";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

const SERVICES: readonly LeadService[] = ["web", "mobile", "design", "unsure"];
const TIMELINES = ["asap", "months", "flexible"] as const;
const CHANNELS = ["whatsapp", "call", "email"] as const;
const SERVER_ERRORS = [
  "invalid_json",
  "payload_too_large",
  "rate_limited",
  "invalid_input",
  "invalid_phone",
  "invalid_name",
  "invalid_email",
  "consent_required",
  "bot_suspected",
  "slot_taken",
  "slot_unavailable",
  "too_many_bookings",
] as const;

type Status = "editing" | "sending" | "sent" | "failed";
type Errors = Partial<Record<"service" | "name" | "phone" | "consent", string>>;

function Choice({
  type,
  name,
  value,
  checked,
  onChange,
  children,
}: {
  type: "radio";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: string;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex min-h-12 items-center justify-center rounded-control border border-surface-line bg-surface ps-4 pe-4 text-center text-[15px] font-semibold",
          "motion-safe:transition-colors hover:border-text-muted/40",
          "peer-checked:border-brand-strong peer-checked:bg-brand-soft peer-checked:text-ink-900",
          "peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink-950",
        )}
      >
        {children}
      </span>
    </label>
  );
}

export function LeadForm({
  type: initialType = "project",
  whatsappHref,
}: {
  type?: LeadType;
  whatsappHref: string | null;
}) {
  const t = useTranslations("start");
  const tf = useTranslations("form");
  const locale = useLocale() === "en" ? "en" : "ar";
  const successRef = useRef<HTMLHeadingElement>(null);
  // Links like /start?type=consultation open the form already set to booking a consultation.
  const queryType = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("type"),
    () => null,
  );
  const [chosen, setChosen] = useState<LeadType | null>(null);
  const type: LeadType = chosen ?? (queryType === "consultation" ? "consultation" : initialType);
  const setType = setChosen;

  const [service, setService] = useState<LeadService | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState<(typeof CHANNELS)[number]>("whatsapp");
  const [businessType, setBusinessType] = useState("");
  const [timeline, setTimeline] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false); // consent always starts unchecked
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("editing");
  const [serverError, setServerError] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [slotsKey, setSlotsKey] = useState(0);
  const [bookedAt, setBookedAt] = useState<string | null>(null);

  function validate(): Errors {
    const next: Errors = {};
    if (!service) next.service = tf("errors.required");
    if (name.trim().length < 2) next.name = tf("errors.required");
    if (!/^[1-9]\d{7,14}$/.test(normalizePhone(phone))) next.phone = tf("errors.phone");
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
    const params = new URLSearchParams(window.location.search);
    const captcha = await getCaptchaToken("lead");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          service,
          name,
          phone,
          email,
          preferredContact,
          businessType,
          timeline,
          description,
          locale,
          consent: true,
          website,
          captcha,
          ...(type === "consultation" && slot ? { slotStartUtc: slot } : {}),
          source: {
            utmSource: params.get("utm_source") ?? "",
            utmMedium: params.get("utm_medium") ?? "",
            utmCampaign: params.get("utm_campaign") ?? "",
            utmTerm: params.get("utm_term") ?? "",
            landingPage: window.location.pathname,
            referrer: document.referrer,
          },
        }),
      });
      if (response.ok) {
        const done = (await response.json().catch(() => null)) as { booking?: { startUtc?: string } } | null;
        setBookedAt(done?.booking?.startUtc ?? null);
        setStatus("sent");
        if (service) track({ name: "generate_lead", params: { form: type, service, locale } });
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: { code?: string; detail?: string } } | null;
      const code = body?.error?.code as (typeof SERVER_ERRORS)[number] | undefined;
      if (code === "slot_taken" || code === "slot_unavailable") {
        // Someone else took that time: clear it and reload the open times, keeping everything the visitor typed.
        setSlot(null);
        setSlotsKey((k) => k + 1);
      }
      setServerError(
        `${code && SERVER_ERRORS.includes(code) ? t(`serverErrors.${code}`) : t("failed")}${body?.error?.detail ? ` [${body.error.detail}]` : ""}`,
      );
      setStatus("failed");
    } catch {
      setServerError(t("failed"));
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="grid gap-4 py-4">
        <span className="grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="text-2xl font-bold text-text outline-none">
          {t("success.title")}
        </h2>
        {bookedAt ? (
          <p className="font-semibold">
            {t("success.booked", {
              time: new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Riyadh",
              }).format(new Date(bookedAt)),
            })}
          </p>
        ) : null}
        <p className="text-text-muted">{t("success.body")}</p>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName("whatsapp", "justify-self-start")}
          >
            <WhatsAppIcon className="size-5" aria-hidden="true" />
            {t("success.whatsapp")}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-form={type} className="grid gap-7">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-[15px] font-semibold">{t("kind.label")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["project", "consultation"] as const).map((value) => (
            <Choice key={value} type="radio" name="kind" value={value} checked={type === value} onChange={() => setType(value)}>
              {t(`kind.${value}`)}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3" aria-describedby={errors.service ? "service-error" : undefined}>
        <legend className="mb-1 text-[15px] font-semibold">{t("serviceLabel")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((value) => (
            <Choice
              key={value}
              type="radio"
              name="service"
              value={value}
              checked={service === value}
              onChange={() => setService(value)}
            >
              {t(`services.${value}`)}
            </Choice>
          ))}
        </div>
        {errors.service ? (
          <p id="service-error" role="alert" className="text-[15px] text-danger">
            {errors.service}
          </p>
        ) : null}
      </fieldset>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Input
          label={t("name")}
          autoComplete="name"
          value={name}
          maxLength={100}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          ltr
          value={phone}
          maxLength={20}
          hint={t("phoneHint")}
          error={errors.phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <Input
        label={t("email")}
        type="email"
        autoComplete="email"
        ltr
        value={email}
        maxLength={200}
        onChange={(e) => setEmail(e.target.value)}
      />

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-[15px] font-semibold">{t("preferredContact")}</legend>
        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.map((value) => (
            <Choice
              key={value}
              type="radio"
              name="preferredContact"
              value={value}
              checked={preferredContact === value}
              onChange={() => setPreferredContact(value)}
            >
              {t(`channels.${value}`)}
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Input
          label={t("businessType")}
          value={businessType}
          maxLength={100}
          onChange={(e) => setBusinessType(e.target.value)}
        />
        <Select label={t("timeline")} value={timeline} onChange={(e) => setTimeline(e.target.value)}>
          <option value="">{t("timelineEmpty")}</option>
          {TIMELINES.map((value) => (
            <option key={value} value={value}>
              {t(`timelines.${value}`)}
            </option>
          ))}
        </Select>
      </div>

      {type === "consultation" ? <SlotPicker value={slot} onChange={setSlot} refreshKey={slotsKey} /> : null}

      <Textarea
        label={t("description")}
        hint={t("descriptionHint")}
        value={description}
        maxLength={2000}
        rows={4}
        onChange={(e) => setDescription(e.target.value)}
      />

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
            aria-describedby={errors.consent ? "consent-error" : undefined}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-1 size-5 shrink-0 accent-[var(--brand-strong)]"
          />
          <span>{tf("consent")}</span>
        </label>
        {errors.consent ? (
          <p id="consent-error" role="alert" className="text-[15px] text-danger">
            {errors.consent}
          </p>
        ) : null}
      </div>

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
