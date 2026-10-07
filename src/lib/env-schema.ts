import { z } from "zod";

const e164OrEmpty = z.union([z.literal(""), z.string().regex(/^[1-9]\d{7,14}$/)]);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["ar", "en"]),
  NEXT_PUBLIC_WHATSAPP_NUMBER: e164OrEmpty,
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY: z.string(),
  NEXT_PUBLIC_GA4_ID: z.string(),
  NEXT_PUBLIC_CLARITY_ID: z.string(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string(),
  NEXT_PUBLIC_SNAP_PIXEL_ID: z.string(),
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: z.string(),
});

export const serverEnvSchema = publicEnvSchema.extend({
  FIREBASE_ADMIN_PROJECT_ID: z.string(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string(),
  APPCHECK_RECAPTCHA_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string(),
  TEAM_ALERT_EMAIL: z.string(),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_CHAT_ID: z.string().optional().default(""),
  RATE_LIMIT_SALT: z.string(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function formatEnvError(error: z.ZodError): string {
  const keys = error.issues.map((issue) => issue.path.join(".") || "environment");
  return `Environment validation failed. Missing or invalid: ${keys.join(", ")}. Copy .env.example to .env.local and set every required value.`;
}

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const parsed = publicEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }
  return parsed.data;
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }
  return parsed.data;
}

export function readPublicSource(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_WHATSAPP_NUMBER: env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_FIREBASE_API_KEY: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY: env.NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY,
    NEXT_PUBLIC_GA4_ID: env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_CLARITY_ID: env.NEXT_PUBLIC_CLARITY_ID,
    NEXT_PUBLIC_META_PIXEL_ID: env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_SNAP_PIXEL_ID: env.NEXT_PUBLIC_SNAP_PIXEL_ID,
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
  };
}

export function readServerSource(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return {
    ...readPublicSource(env),
    FIREBASE_ADMIN_PROJECT_ID: env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: env.FIREBASE_ADMIN_PRIVATE_KEY,
    APPCHECK_RECAPTCHA_SECRET: env.APPCHECK_RECAPTCHA_SECRET,
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    TEAM_ALERT_EMAIL: env.TEAM_ALERT_EMAIL,
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID,
    RATE_LIMIT_SALT: env.RATE_LIMIT_SALT,
  };
}
