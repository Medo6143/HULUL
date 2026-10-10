// Booking emails: plain wording, no emoji, and no promise about reply times (MISSING_CONTENT.md).

export interface BookingEmail {
  subject: string;
  text: string;
  html: string;
}

export interface BookingEmailInput {
  locale: "ar" | "en";
  name: string;
  phone: string;
  email: string;
  startUtc: Date;
  meetingLink: string;
  /** Link where the customer can cancel. */
  cancelUrl: string;
  /** Optional "add to Google Calendar" link. */
  calendarUrl?: string;
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Date and time in Riyadh time, for either language, with Latin digits so it reads the same everywhere. */
export function formatBookingTime(start: Date, locale: "ar" | "en"): string {
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Riyadh",
  });
  return `${formatter.format(start)} ${locale === "ar" ? "(توقيت الرياض)" : "(Riyadh time)"}`;
}

function render(lines: string[], links: Set<string>): { text: string; html: string } {
  const html =
    `<div dir="auto" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    lines
      .map((line) => {
        if (line === "") return "<br>";
        if (links.has(line)) return `<p style="margin:0 0 6px"><a href="${esc(line)}">${esc(line)}</a></p>`;
        return `<p style="margin:0 0 6px">${esc(line)}</p>`;
      })
      .join("") +
    "</div>";
  return { text: lines.join("\n"), html };
}

/** Confirmation sent to the customer, with the calendar file attached by the caller. */
export function renderBookingConfirmation(input: BookingEmailInput): BookingEmail {
  const when = formatBookingTime(input.startUtc, input.locale);
  const ar = input.locale === "ar";
  const links = new Set<string>();
  const lines = ar
    ? [`هلا ${input.name}،`, "", "تم تأكيد موعد استشارتك مع حلول تك.", `الموعد: ${when}`]
    : [`Hello ${input.name},`, "", "Your consultation with HULOL TECH is confirmed.", `Time: ${when}`];
  if (input.meetingLink) {
    lines.push("", ar ? "رابط الاجتماع:" : "Meeting link:", input.meetingLink);
    links.add(input.meetingLink);
  }
  if (input.calendarUrl) {
    lines.push("", ar ? "أضف الموعد إلى تقويم جوجل:" : "Add to Google Calendar:", input.calendarUrl);
    links.add(input.calendarUrl);
  }
  lines.push("", ar ? "إذا ما يناسبك الموعد تقدر تلغيه من هنا:" : "If this time no longer suits you, you can cancel here:", input.cancelUrl);
  links.add(input.cancelUrl);
  const body = render(lines, links);
  return { subject: ar ? "تأكيد موعد الاستشارة" : "Your consultation is confirmed", ...body };
}

/** Alert for the team when a consultation is booked. */
export function renderBookingTeamAlert(input: BookingEmailInput): BookingEmail {
  const when = formatBookingTime(input.startUtc, "ar");
  const lines = [
    "تم حجز استشارة جديدة.",
    `الموعد: ${when}`,
    `الاسم: ${input.name}`,
    `الجوال: ${input.phone}`,
    ...(input.email ? [`البريد: ${input.email}`] : []),
  ];
  return { subject: `حجز استشارة: ${input.name}`, ...render(lines, new Set()) };
}

export function renderBookingCancellation(input: BookingEmailInput): BookingEmail {
  const when = formatBookingTime(input.startUtc, input.locale);
  const ar = input.locale === "ar";
  const lines = ar
    ? [`هلا ${input.name}،`, "", `تم إلغاء موعد الاستشارة الذي كان في ${when}.`]
    : [`Hello ${input.name},`, "", `Your consultation scheduled for ${when} has been cancelled.`];
  return { subject: ar ? "تم إلغاء موعد الاستشارة" : "Your consultation was cancelled", ...render(lines, new Set()) };
}

export function renderBookingCancelledAlert(input: BookingEmailInput): BookingEmail {
  const lines = [
    "تم إلغاء موعد استشارة.",
    `الموعد: ${formatBookingTime(input.startUtc, "ar")}`,
    `الاسم: ${input.name}`,
    `الجوال: ${input.phone}`,
  ];
  return { subject: `إلغاء موعد: ${input.name}`, ...render(lines, new Set()) };
}
