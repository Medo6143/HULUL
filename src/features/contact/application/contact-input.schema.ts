import { z } from "zod";
import { MESSAGE_MAX, type NewContactMessage } from "../domain/contact-message";

/** Boundary schema for POST /api/contact. Unknown keys are stripped. */
export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  locale: z.enum(["ar", "en"]),
  consent: z.literal(true),
  /** Honeypot: real users never fill this. */
  website: z.string().max(200).optional(),
  captcha: z.string().max(4000).optional(),
});

export type ContactInputPayload = z.infer<typeof contactInputSchema>;

export function toNewContactMessage(payload: ContactInputPayload): NewContactMessage {
  return {
    name: payload.name,
    email: payload.email,
    message: payload.message,
    locale: payload.locale,
    consentGranted: payload.consent,
  };
}
