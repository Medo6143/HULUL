import { describe, expect, it } from "vitest";
import { parseServerEnv, type ServerEnv } from "@/lib/env-schema";

const valid: Record<keyof ServerEnv, string> = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_DEFAULT_LOCALE: "ar",
  NEXT_PUBLIC_WHATSAPP_NUMBER: "",
  NEXT_PUBLIC_FIREBASE_API_KEY: "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
  NEXT_PUBLIC_FIREBASE_APP_ID: "",
  NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY: "",
  NEXT_PUBLIC_GA4_ID: "",
  NEXT_PUBLIC_CLARITY_ID: "",
  NEXT_PUBLIC_META_PIXEL_ID: "",
  NEXT_PUBLIC_SNAP_PIXEL_ID: "",
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: "",
  FIREBASE_ADMIN_PROJECT_ID: "",
  FIREBASE_ADMIN_CLIENT_EMAIL: "",
  FIREBASE_ADMIN_PRIVATE_KEY: "",
  APPCHECK_RECAPTCHA_SECRET: "",
  RESEND_API_KEY: "",
  EMAIL_FROM: "",
  TEAM_ALERT_EMAIL: "",
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
  RATE_LIMIT_SALT: "",
};

describe("parseServerEnv", () => {
  it("accepts a complete environment", () => {
    expect(parseServerEnv(valid).NEXT_PUBLIC_DEFAULT_LOCALE).toBe("ar");
  });

  it("refuses to continue when a required variable is missing", () => {
    const source: Record<string, string | undefined> = { ...valid, NEXT_PUBLIC_SITE_URL: undefined };
    expect(() => parseServerEnv(source)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("refuses a whatsapp value that is not E.164", () => {
    expect(() => parseServerEnv({ ...valid, NEXT_PUBLIC_WHATSAPP_NUMBER: "0500000000" })).toThrow(
      /NEXT_PUBLIC_WHATSAPP_NUMBER/,
    );
  });
});
