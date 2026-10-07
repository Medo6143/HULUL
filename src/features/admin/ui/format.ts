const DATE = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

/** Gregorian date in Riyadh time with western digits (storage is UTC). */
export const formatDateTime = (iso: string): string => DATE.format(new Date(iso));
