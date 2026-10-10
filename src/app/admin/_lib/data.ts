import "server-only";
import { computeAnalytics, demoLeads, findDemoLead, toAdminDetail, toAdminLead } from "@/features/admin";
import type { AdminLead, AdminLeadDetail, AnalyticsData } from "@/features/admin";
import { FIRST_REPLY_LIMIT_HOURS } from "@/config/sla";
import { container } from "@/lib/container";
import type { AvailabilityData, BookingRow, CaseStudyRow, ExceptionRow, TeamRow, TestimonialRow } from "@/features/admin";
import { EMPTY_AVAILABILITY, addDaysToKey, riyadhDateKey } from "@/features/bookings";
import { getTranslations } from "next-intl/server";
import type { InviteCardData } from "@/features/admin";
import { DEFAULT_TEMPLATES, type InviteTemplates } from "@/features/templates";
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
          images: [],
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

export async function loadBookings(): Promise<{ bookings: BookingRow[]; demo: boolean; nowIso: string }> {
  const now = container.clock.now();
  if (isAdminDemo()) return { bookings: [], demo: true, nowIso: now.toISOString() };
  const list = await container.listBookings();
  const bookings = await list({
    from: new Date(now.getTime() - 14 * 86_400_000),
    to: new Date(now.getTime() + 120 * 86_400_000),
  });
  return {
    demo: false,
    nowIso: now.toISOString(),
    bookings: bookings.map((b) => ({
      id: b.id,
      leadId: b.leadId,
      name: b.name,
      phone: b.phone,
      email: b.email,
      startUtc: b.startUtc.toISOString(),
      endUtc: b.endUtc.toISOString(),
      status: b.status,
    })),
  };
}

export async function loadAvailability(): Promise<{ availability: AvailabilityData; exceptions: ExceptionRow[]; demo: boolean }> {
  if (isAdminDemo()) return { availability: EMPTY_AVAILABILITY, exceptions: [], demo: true };
  const today = riyadhDateKey(container.clock.now());
  const get = await container.getAvailability();
  const { availability, exceptions } = await get({ exceptionsFrom: today, exceptionsTo: addDaysToKey(today, 365) });
  return { availability, exceptions, demo: false };
}

export async function loadTemplates(): Promise<{ templates: InviteTemplates; isDefault: boolean; demo: boolean }> {
  if (isAdminDemo()) return { templates: DEFAULT_TEMPLATES, isDefault: true, demo: true };
  const get = await container.getTemplates();
  return { ...(await get()), demo: false };
}

/** Everything the lead page needs to prefill an invitation. Null when Firestore cannot be read. */
export async function loadInviteCard(service: string, demo: boolean): Promise<InviteCardData | null> {
  try {
    const [ar, en] = await Promise.all([
      getTranslations({ locale: "ar", namespace: "start.services" }),
      getTranslations({ locale: "en", namespace: "start.services" }),
    ]);
    const [brandAr, brandEn] = await Promise.all([
      getTranslations({ locale: "ar", namespace: "brand" }),
      getTranslations({ locale: "en", namespace: "brand" }),
    ]);
    if (demo) {
      return {
        templates: DEFAULT_TEMPLATES,
        meetingLink: "",
        company: { ar: brandAr("name"), en: brandEn("name") },
        service: { ar: ar(service as "web"), en: en(service as "web") },
      };
    }
    const today = riyadhDateKey(container.clock.now());
    const [{ templates }, { availability }] = await Promise.all([
      (await container.getTemplates())(),
      (await container.getAvailability())({ exceptionsFrom: today, exceptionsTo: today }),
    ]);
    return {
      templates,
      meetingLink: availability.meetingLink,
      company: { ar: brandAr("name"), en: brandEn("name") },
      service: { ar: ar(service as "web"), en: en(service as "web") },
    };
  } catch {
    return null;
  }
}
