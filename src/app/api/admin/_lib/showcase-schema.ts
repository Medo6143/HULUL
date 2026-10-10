import { z } from "zod";

const localized = (max: number) =>
  z.object({ ar: z.string().max(max).default(""), en: z.string().max(max).default("") });

const consent = {
  consentToPublish: z.boolean(),
  consentNote: z.string().max(500).default(""),
  published: z.boolean().default(false),
  order: z.number().int().min(0).max(9999).default(0),
};

export const testimonialSchema = z.object({
  quote: localized(600),
  name: localized(100),
  role: localized(100),
  company: z.string().max(100).default(""),
  city: z.string().max(60).default(""),
  ...consent,
});

export const caseStudySchema = z.object({
  slug: z.string().max(60),
  category: z.string().max(20),
  title: localized(140),
  result: localized(400),
  problem: localized(3000),
  solution: localized(3000),
  clientName: z.string().max(100).default(""),
  clientNameConsent: z.boolean().default(false),
  ...consent,
});

export const publishSchema = z.object({ published: z.boolean() });

export const SHOWCASE_STATUS: Record<string, number> = {
  invalid_input: 400,
  invalid_slug: 400,
  consent_required: 422,
  consent_note_required: 422,
  not_found: 404,
  slug_exists: 409,
};
