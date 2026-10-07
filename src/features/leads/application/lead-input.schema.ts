import { z } from "zod";
import type { NewLeadInput } from "../domain/lead";

const text = (max: number) => z.string().trim().max(max).default("");

/** Boundary schema for POST /api/leads. Unknown keys are stripped. */
export const leadInputSchema = z.object({
  type: z.enum(["project", "consultation"]).default("project"),
  segment: text(40),
  service: z.enum(["web", "mobile", "design", "unsure"]),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]).default(""),
  preferredContact: z.enum(["whatsapp", "call", "email"]).default("whatsapp"),
  businessType: text(100),
  budgetRange: text(40),
  timeline: text(40),
  description: text(2000),
  locale: z.enum(["ar", "en"]),
  consent: z.literal(true),
  source: z
    .object({
      utmSource: text(100),
      utmMedium: text(100),
      utmCampaign: text(100),
      utmTerm: text(100),
      landingPage: text(300),
      referrer: text(300),
    })
    .default({
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      landingPage: "",
      referrer: "",
    }),
  /** Honeypot: real users never fill this. */
  website: z.string().max(200).optional(),
});

export type LeadInputPayload = z.infer<typeof leadInputSchema>;

export function toNewLeadInput(payload: LeadInputPayload): NewLeadInput {
  const { consent, website, ...rest } = payload;
  void website;
  return { ...rest, consentGranted: consent };
}
