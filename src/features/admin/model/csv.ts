import type { AdminLead } from "./admin-lead";

const BOM = String.fromCharCode(0xfeff);

export const CSV_COLUMNS = [
  "id",
  "created_at",
  "name",
  "phone",
  "email",
  "service",
  "status",
  "source",
  "campaign",
  "landing_page",
  "business",
  "timeline",
  "preferred_contact",
  "description",
  "lost_reason",
] as const;

/** Quotes a cell, and neutralizes spreadsheet formulas (a cell starting with = + - @ would run in Excel). */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** UTF-8 with a BOM so Excel shows Arabic correctly, columns in a fixed order. */
export function leadsToCsv(leads: AdminLead[]): string {
  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.createdAt,
      lead.name,
      lead.phone,
      lead.email,
      lead.service,
      lead.status,
      lead.source,
      lead.campaign,
      lead.landing,
      lead.business,
      lead.timeline,
      lead.preferred,
      lead.description,
      lead.lostReason,
    ]
      .map(csvCell)
      .join(","),
  );
  return `${BOM}${[CSV_COLUMNS.join(","), ...rows].join("\r\n")}\r\n`;
}
