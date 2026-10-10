import "server-only";
import { computeAnalytics, demoLeads, findDemoLead, toAdminDetail, toAdminLead } from "@/features/admin";
import type { AdminLead, AdminLeadDetail, AnalyticsData } from "@/features/admin";
import { FIRST_REPLY_LIMIT_HOURS } from "@/config/sla";
import { container } from "@/lib/container";
import { isAdminDemo } from "./staff";

export async function loadLeads(): Promise<{ leads: AdminLead[]; demo: boolean }> {
  if (isAdminDemo()) return { leads: demoLeads, demo: true };
  const list = await container.listLeads();
  return { leads: (await list()).map(toAdminLead), demo: false };
}

export async function loadLeadDetail(id: string): Promise<{ lead: AdminLeadDetail; demo: boolean } | null> {
  if (isAdminDemo()) {
    const lead = findDemoLead(id);
    return lead ? { lead, demo: true } : null;
  }
  const get = await container.getLeadDetail();
  const result = await get(id);
  if (!result.ok) return null;
  return { lead: toAdminDetail(result.value.lead, result.value.history, result.value.notes), demo: false };
}

export async function loadAnalytics(): Promise<AnalyticsData> {
  const { leads } = await loadLeads();
  return computeAnalytics(leads, new Date(), FIRST_REPLY_LIMIT_HOURS);
}

/** Admin-to-lead WhatsApp link: just the chat, without a prefilled message. Null for demo rows. */
export function leadWhatsappHref(phone: string, demo: boolean): string | null {
  if (demo) return null;
  const digits = phone.replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? `https://wa.me/${digits}` : null;
}
