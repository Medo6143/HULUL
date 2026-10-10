// DESIGN-ONLY sample data. Not real customers. Replace with Firestore reads when the admin is wired.
import type { AdminLeadDetail, LeadStatusKey as LeadStatus } from "../model/admin-lead";

type DemoService = "web" | "mobile" | "design" | "unsure";
type DemoSource = "google" | "direct" | "linkedin" | "snapchat" | "referral" | "whatsapp";

interface RawDemoLead {
  id: string;
  name: string;
  business: string;
  service: DemoService;
  phone: string; // display only, obviously fake
  email: string;
  preferred: "whatsapp" | "call" | "email";
  status: LeadStatus;
  source: DemoSource;
  campaign: string;
  landing: string;
  timeline: "asap" | "months" | "flexible" | "";
  description: string;
  createdAt: string; // ISO, UTC
  assigned: string;
  isNew: boolean;
  lostReason?: "price" | "timing" | "competitor" | "noReply" | "notFit" | "other";
  history: { from: LeadStatus | null; to: LeadStatus; by: string; at: string; reason?: string }[];
  notes: { by: string; at: string; text: string }[];
}

const staff = "مدير تجريبي";

const raw: RawDemoLead[] = [
  {
    id: "demo-01",
    name: "عميل تجريبي A",
    business: "متجر تجريبي للإكسسوارات",
    service: "web",
    phone: "+966 50 000 0001",
    email: "a@example.test",
    preferred: "whatsapp",
    status: "new",
    source: "google",
    campaign: "sme-web-riyadh",
    landing: "/for/smes",
    timeline: "asap",
    description: "نص تجريبي لوصف مشروع موقع متجر إلكتروني.",
    createdAt: "2026-10-07T08:12:00Z",
    assigned: "",
    isNew: true,
    history: [{ from: null, to: "new", by: "النظام", at: "2026-10-07T08:12:00Z" }],
    notes: [],
  },
  {
    id: "demo-02",
    name: "عميل تجريبي B",
    business: "عيادة تجريبية",
    service: "mobile",
    phone: "+966 50 000 0002",
    email: "",
    preferred: "call",
    status: "new",
    source: "snapchat",
    campaign: "app-launch",
    landing: "/services/mobile",
    timeline: "months",
    description: "نص تجريبي لوصف تطبيق حجز مواعيد.",
    createdAt: "2026-10-07T06:40:00Z",
    assigned: "",
    isNew: true,
    history: [{ from: null, to: "new", by: "النظام", at: "2026-10-07T06:40:00Z" }],
    notes: [],
  },
  {
    id: "demo-03",
    name: "عميل تجريبي C",
    business: "شركة تجريبية للخدمات اللوجستية",
    service: "web",
    phone: "+966 50 000 0003",
    email: "c@example.test",
    preferred: "email",
    status: "contacted",
    source: "linkedin",
    campaign: "enterprise-intro",
    landing: "/for/enterprise",
    timeline: "flexible",
    description: "نص تجريبي لوصف بوابة عملاء.",
    createdAt: "2026-10-06T11:05:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-10-06T11:05:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-10-06T12:30:00Z" },
    ],
    notes: [{ by: staff, at: "2026-10-06T12:32:00Z", text: "ملاحظة تجريبية: تم الاتصال وننتظر الرد." }],
  },
  {
    id: "demo-04",
    name: "عميل تجريبي D",
    business: "مطعم تجريبي",
    service: "design",
    phone: "+966 50 000 0004",
    email: "d@example.test",
    preferred: "whatsapp",
    status: "consultation",
    source: "direct",
    campaign: "",
    landing: "/",
    timeline: "asap",
    description: "نص تجريبي لوصف هوية بصرية جديدة.",
    createdAt: "2026-10-05T09:20:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-10-05T09:20:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-10-05T10:00:00Z" },
      { from: "contacted", to: "consultation", by: staff, at: "2026-10-06T09:00:00Z" },
    ],
    notes: [{ by: staff, at: "2026-10-06T09:05:00Z", text: "ملاحظة تجريبية: موعد الاستشارة محدد." }],
  },
  {
    id: "demo-05",
    name: "عميل تجريبي E",
    business: "شركة ناشئة تجريبية",
    service: "mobile",
    phone: "+966 50 000 0005",
    email: "e@example.test",
    preferred: "whatsapp",
    status: "proposal",
    source: "referral",
    campaign: "",
    landing: "/for/startups",
    timeline: "months",
    description: "نص تجريبي لوصف تطبيق لشركة ناشئة.",
    createdAt: "2026-10-02T13:45:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-10-02T13:45:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-10-02T15:00:00Z" },
      { from: "contacted", to: "consultation", by: staff, at: "2026-10-03T10:00:00Z" },
      { from: "consultation", to: "proposal", by: staff, at: "2026-10-05T12:00:00Z" },
    ],
    notes: [],
  },
  {
    id: "demo-06",
    name: "عميل تجريبي F",
    business: "وكالة تجريبية",
    service: "web",
    phone: "+966 50 000 0006",
    email: "f@example.test",
    preferred: "email",
    status: "negotiation",
    source: "linkedin",
    campaign: "agency-partner",
    landing: "/for/agencies",
    timeline: "flexible",
    description: "نص تجريبي لوصف شراكة تنفيذ.",
    createdAt: "2026-09-29T07:10:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-09-29T07:10:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-09-29T09:00:00Z" },
      { from: "contacted", to: "consultation", by: staff, at: "2026-09-30T09:00:00Z" },
      { from: "consultation", to: "proposal", by: staff, at: "2026-10-01T09:00:00Z" },
      { from: "proposal", to: "negotiation", by: staff, at: "2026-10-04T09:00:00Z" },
    ],
    notes: [],
  },
  {
    id: "demo-07",
    name: "عميل تجريبي G",
    business: "مركز تدريب تجريبي",
    service: "web",
    phone: "+966 50 000 0007",
    email: "g@example.test",
    preferred: "whatsapp",
    status: "won",
    source: "google",
    campaign: "sme-web-riyadh",
    landing: "/for/smes",
    timeline: "asap",
    description: "نص تجريبي لوصف موقع مركز تدريب.",
    createdAt: "2026-09-20T10:00:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-09-20T10:00:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-09-20T11:00:00Z" },
      { from: "contacted", to: "consultation", by: staff, at: "2026-09-21T09:00:00Z" },
      { from: "consultation", to: "proposal", by: staff, at: "2026-09-23T09:00:00Z" },
      { from: "proposal", to: "won", by: staff, at: "2026-09-28T09:00:00Z" },
    ],
    notes: [],
  },
  {
    id: "demo-08",
    name: "عميل تجريبي H",
    business: "صالون تجريبي",
    service: "design",
    phone: "+966 50 000 0008",
    email: "",
    preferred: "call",
    status: "lost",
    source: "snapchat",
    campaign: "brand-offer",
    landing: "/services/design",
    timeline: "months",
    description: "نص تجريبي لوصف شعار وهوية.",
    createdAt: "2026-09-18T16:30:00Z",
    assigned: staff,
    isNew: false,
    lostReason: "price",
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-09-18T16:30:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-09-19T09:00:00Z" },
      { from: "contacted", to: "lost", by: staff, at: "2026-09-22T09:00:00Z", reason: "السعر" },
    ],
    notes: [],
  },
  {
    id: "demo-09",
    name: "عميل تجريبي I",
    business: "شركة تجريبية للتجزئة",
    service: "unsure",
    phone: "+966 50 000 0009",
    email: "i@example.test",
    preferred: "whatsapp",
    status: "parked",
    source: "whatsapp",
    campaign: "",
    landing: "/",
    timeline: "flexible",
    description: "",
    createdAt: "2026-09-15T12:00:00Z",
    assigned: "",
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-09-15T12:00:00Z" },
      { from: "new", to: "parked", by: staff, at: "2026-09-16T09:00:00Z" },
    ],
    notes: [],
  },
  {
    id: "demo-10",
    name: "عميل تجريبي J",
    business: "مكتب استشارات تجريبي",
    service: "web",
    phone: "+966 50 000 0010",
    email: "j@example.test",
    preferred: "email",
    status: "contacted",
    source: "google",
    campaign: "sme-web-riyadh",
    landing: "/services/web",
    timeline: "asap",
    description: "نص تجريبي لوصف موقع تعريفي.",
    createdAt: "2026-10-06T14:25:00Z",
    assigned: staff,
    isNew: false,
    history: [
      { from: null, to: "new", by: "النظام", at: "2026-10-06T14:25:00Z" },
      { from: "new", to: "contacted", by: staff, at: "2026-10-06T15:00:00Z" },
    ],
    notes: [],
  },
];

const normalize = (lead: RawDemoLead): AdminLeadDetail => {
  const firstReply = lead.history.find((entry) => entry.from === "new");
  return {
    id: lead.id,
    name: lead.name,
    business: lead.business,
    service: lead.service,
    phone: lead.phone,
    email: lead.email,
    preferred: lead.preferred,
    status: lead.status,
    source: lead.source,
    campaign: lead.campaign,
    landing: lead.landing,
    timeline: lead.timeline,
    description: lead.description,
    createdAt: lead.createdAt,
    firstResponseAt: firstReply ? firstReply.at : null,
    assigned: lead.assigned,
    isNew: lead.isNew,
    lostReason: lead.lostReason ?? "",
    history: lead.history.map((entry) => ({ ...entry, reason: entry.reason ?? "" })),
    notes: lead.notes.map((note, index) => ({ id: `${lead.id}-n${index}`, ...note })),
  };
};

export const demoLeads: AdminLeadDetail[] = raw.map(normalize);

export const findDemoLead = (id: string) => demoLeads.find((lead) => lead.id === id);
