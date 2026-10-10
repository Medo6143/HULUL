import type { ContactReceivedEvent, LeadCreatedEvent, NotifyLocale, RenderedEmail } from "./events";

// Plain, emoji-free email bodies. Nothing here promises a reply time or a price: those are not confirmed.

const BRAND: Record<NotifyLocale, string> = { ar: "حلول تك", en: "HULOL TECH" };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SERVICES: Record<NotifyLocale, Record<string, string>> = {
  ar: { web: "موقع إلكتروني", mobile: "تطبيق جوال", design: "هوية وتصميم", unsure: "غير محدد" },
  en: { web: "Website", mobile: "Mobile app", design: "Brand and design", unsure: "Not specified" },
};

function wrap(locale: NotifyLocale, lines: string[]): { text: string; html: string } {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const text = lines.join("\n");
  const html =
    `<div dir="${dir}" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    lines.map((line) => (line === "" ? "<br>" : `<p style="margin:0 0 6px">${escapeHtml(line)}</p>`)).join("") +
    "</div>";
  return { text, html };
}

/** Alert for the team: always in Arabic, the team's working language. */
export function renderLeadAlert(event: LeadCreatedEvent): RenderedEmail {
  const kind = event.type === "consultation" ? "استشارة" : "مشروع";
  const lines = [
    `وصل طلب جديد (${kind})`,
    "",
    `الاسم: ${event.name}`,
    `الجوال: ${event.phone}`,
    `البريد: ${event.email || "لم يُذكر"}`,
    `الخدمة: ${SERVICES.ar[event.service] ?? event.service}`,
    `الصفحة: ${event.landingPage || "-"}`,
    `اللغة: ${event.locale === "ar" ? "عربي" : "إنجليزي"}`,
    "",
    event.description ? `الوصف: ${event.description}` : "بدون وصف",
  ];
  return { subject: `طلب جديد: ${event.name}`, ...wrap("ar", lines) };
}

export function renderLeadConfirmation(event: LeadCreatedEvent): RenderedEmail {
  const brand = BRAND[event.locale];
  if (event.locale === "ar") {
    return {
      subject: `وصلنا طلبك | ${brand}`,
      ...wrap("ar", [`هلا ${event.name}،`, "", "وصلنا طلبك، وفريقنا يراجعه ويتواصل معك.", "", brand]),
    };
  }
  return {
    subject: `We received your request | ${brand}`,
    ...wrap("en", [`Hello ${event.name},`, "", "We received your request. Our team is reviewing it and will get in touch.", "", brand]),
  };
}

export function renderContactAlert(event: ContactReceivedEvent): RenderedEmail {
  const lines = [
    "وصلت رسالة جديدة من نموذج التواصل",
    "",
    `الاسم: ${event.name}`,
    `البريد: ${event.email}`,
    "",
    event.message,
  ];
  return { subject: `رسالة جديدة: ${event.name}`, ...wrap("ar", lines) };
}

export function renderContactConfirmation(event: ContactReceivedEvent): RenderedEmail {
  const brand = BRAND[event.locale];
  if (event.locale === "ar") {
    return {
      subject: `وصلتنا رسالتك | ${brand}`,
      ...wrap("ar", [`هلا ${event.name}،`, "", "وصلتنا رسالتك، ونقرأها ونرجع لك على بريدك.", "", brand]),
    };
  }
  return {
    subject: `We received your message | ${brand}`,
    ...wrap("en", [`Hello ${event.name},`, "", "We received your message and will reply to this email.", "", brand]),
  };
}
