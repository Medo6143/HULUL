// iCalendar (RFC 5545) builder for the booking confirmation attachment. Times are UTC; text is escaped; long
// lines are folded at 75 octets without splitting a UTF-8 character (needed for Arabic text).

export interface IcsInput {
  uid: string;
  method: "REQUEST" | "CANCEL";
  sequence: number;
  start: Date;
  end: Date;
  stamp: Date;
  summary: string;
  description: string;
  location: string;
  /** Attendee (the customer) email; omitted when unknown. */
  attendeeEmail?: string;
  attendeeName?: string;
  organizerEmail?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const formatIcsDate = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const escapeText = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Parameter values (CN) cannot contain quotes, semicolons, colons, or commas safely; strip them. */
const paramValue = (value: string): string => `"${value.replace(/["\r\n]/g, "")}"`;

const encoder = new TextEncoder();

/** Folds one logical line into physical lines of at most 75 octets; continuation lines start with a space. */
export function foldLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = " ";
      bytes = 1;
      limit = 75;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out;
}

export function buildIcs(input: IcsInput): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HULOL TECH//Consultation//AR",
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method}`,
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${formatIcsDate(input.stamp)}`,
    `DTSTART:${formatIcsDate(input.start)}`,
    `DTEND:${formatIcsDate(input.end)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    ...(input.location ? [`LOCATION:${escapeText(input.location)}`] : []),
    `STATUS:${input.method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    ...(input.organizerEmail ? [`ORGANIZER:mailto:${input.organizerEmail}`] : []),
    ...(input.attendeeEmail
      ? [`ATTENDEE;CN=${paramValue(input.attendeeName ?? input.attendeeEmail)};RSVP=FALSE:mailto:${input.attendeeEmail}`]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.flatMap(foldLine).join("\r\n")}\r\n`;
}

/** "Add to Google Calendar" link for the same event. */
export function googleCalendarUrl(input: { start: Date; end: Date; title: string; details: string; location: string }): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatIcsDate(input.start)}/${formatIcsDate(input.end)}`,
    details: input.details,
    location: input.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
