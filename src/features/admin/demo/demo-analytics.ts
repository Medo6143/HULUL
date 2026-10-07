// DESIGN-ONLY sample numbers. They are invented to show the layout and mean nothing.
import type { DemoSource } from "./demo-leads";

export const demoKpis = [
  { key: "new", value: 24, delta: 12 },
  { key: "consultations", value: 9, delta: 3 },
  { key: "proposals", value: 5, delta: -1 },
  { key: "won", value: 2, delta: 1 },
] as const;

export const demoFirstReplyHours = { median: 2.4, delta: -0.6, overLimit: 3 };

export const demoFunnel = [
  { status: "new", count: 24 },
  { status: "contacted", count: 19 },
  { status: "consultation", count: 9 },
  { status: "proposal", count: 5 },
  { status: "won", count: 2 },
] as const;

export const demoSources: { source: DemoSource; leads: number; deals: number }[] = [
  { source: "google", leads: 9, deals: 1 },
  { source: "linkedin", leads: 5, deals: 1 },
  { source: "snapchat", leads: 4, deals: 0 },
  { source: "direct", leads: 3, deals: 0 },
  { source: "referral", leads: 2, deals: 0 },
  { source: "whatsapp", leads: 1, deals: 0 },
];

export const demoServices = [
  { key: "web", value: 11 },
  { key: "mobile", value: 6 },
  { key: "design", value: 4 },
  { key: "unsure", value: 3 },
] as const;

export const demoLosses = [
  { key: "price", value: 4 },
  { key: "timing", value: 2 },
  { key: "competitor", value: 2 },
  { key: "noReply", value: 1 },
  { key: "notFit", value: 1 },
] as const;

export const demoChannels = { form: 17, whatsapp: 7 };
