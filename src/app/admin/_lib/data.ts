import "server-only";
import { computeAnalytics, demoLeads, findDemoLead, toAdminDetail, toAdminLead } from "@/features/admin";
import type { AdminLead, AdminLeadDetail, AnalyticsData } from "@/features/admin";
import { FIRST_REPLY_LIMIT_HOURS } from "@/config/sla";
import { container } from "@/lib/container";
import type { CaseStudyRow, TeamRow, TestimonialRow } from "@/features/admin";
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

export async function loadTeam(): Promise<{ members: TeamRow[]; demo: boolean }> {
  if (isAdminDemo()) {
    return {
      demo: true,
      members: [
        { uid: "demo", email: "demo@example.test", name: "مدير تجريبي", role: "owner", disabled: false, lastSignInAt: null },
        { uid: "demo-2", email: "agent@example.test", name: "موظف تجريبي", role: "agent", disabled: false, lastSignInAt: null },
      ],
    };
  }
  const list = await container.listStaff();
  const members = await list();
  return {
    demo: false,
    members: members.map((m) => ({
      uid: m.uid,
      email: m.email,
      name: m.name,
      role: m.role,
      disabled: m.disabled,
      lastSignInAt: m.lastSignInAt ? m.lastSignInAt.toISOString() : null,
    })),
  };
}

export async function loadRecipients(): Promise<{ recipients: string[]; demo: boolean }> {
  if (isAdminDemo()) return { recipients: ["team@example.test"], demo: true };
  const store = await container.recipientStore();
  return { recipients: await store.list(), demo: false };
}

const demoPair = { ar: "نموذج تجريبي", en: "Demo sample" };

export async function loadTestimonials(): Promise<{ items: TestimonialRow[]; demo: boolean }> {
  if (isAdminDemo()) {
    return {
      demo: true,
      items: [
        {
          id: "demo",
          quote: { ar: "نص رأي تجريبي للتصميم فقط.", en: "Sample quote for design only." },
          name: demoPair,
          role: demoPair,
          company: "",
          city: "",
          consentToPublish: false,
          consentNote: "",
          published: false,
          order: 0,
        },
      ],
    };
  }
  const list = await container.listTestimonials();
  return { items: await list(), demo: false };
}

export async function loadCaseStudies(): Promise<{ items: CaseStudyRow[]; demo: boolean }> {
  if (isAdminDemo()) {
    return {
      demo: true,
      items: [
        {
          slug: "demo-case",
          category: "web",
          title: demoPair,
          result: demoPair,
          problem: demoPair,
          solution: demoPair,
          clientName: "",
          clientNameConsent: false,
          consentToPublish: false,
          consentNote: "",
          published: false,
          order: 0,
        },
      ],
    };
  }
  const list = await container.listCaseStudies();
  return { items: await list(), demo: false };
}
