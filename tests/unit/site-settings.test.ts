import { describe, expect, it } from "vitest";
import { EMPTY_SITE_SETTINGS, fromStored, makeSaveSiteSettings, normalizeSiteSettings, normalizeWhatsapp, type SiteSettings } from "@/features/site-settings";

const base = (over: Partial<SiteSettings> = {}): SiteSettings => ({ ...EMPTY_SITE_SETTINGS, ...over });

describe("site settings", () => {
  it("normalizes the WhatsApp number to digits with country code", () => {
    expect(normalizeWhatsapp("+966 58 189 7297")).toBe("966581897297");
    expect(normalizeWhatsapp("0581897297")).toBe("966581897297");
    expect(normalizeWhatsapp("00966581897297")).toBe("966581897297");
  });
  it("accepts empty values (they hide the button, phone, or link) and valid ones", () => {
    expect(normalizeSiteSettings(base()).ok).toBe(true);
    const r = normalizeSiteSettings(base({ whatsappNumber: "0581897297", phoneDisplay: "+966 58 189 7297", email: " Info@Example.com ", socials: { instagram: "https://instagram.com/hulol" } }));
    expect(r).toMatchObject({ ok: true, value: { whatsappNumber: "966581897297", email: "info@example.com" } });
  });
  it("rejects a bad number, phone text, email, or a non-https / script link, naming the field", () => {
    expect(normalizeSiteSettings(base({ whatsappNumber: "12" }))).toMatchObject({ ok: false, error: { code: "invalid_whatsapp" } });
    expect(normalizeSiteSettings(base({ phoneDisplay: "call <me>" }))).toMatchObject({ ok: false, error: { code: "invalid_phone" } });
    expect(normalizeSiteSettings(base({ email: "nope" }))).toMatchObject({ ok: false, error: { code: "invalid_email" } });
    expect(normalizeSiteSettings(base({ socials: { x: "http://x.com/a" } }))).toMatchObject({ ok: false, error: { code: "invalid_url", field: "x" } });
    expect(normalizeSiteSettings(base({ socials: { tiktok: "javascript:alert(1)" } }))).toMatchObject({ ok: false, error: { code: "invalid_url", field: "tiktok" } });
  });
  it("drops blank social links and unknown keys when saving", async () => {
    const saved: SiteSettings[] = [];
    const save = makeSaveSiteSettings({ store: { get: async () => EMPTY_SITE_SETTINGS, save: async (s) => void saved.push(s) } });
    await save({ settings: base({ socials: { instagram: " ", facebook: "https://facebook.com/hulol", bogus: "https://x.example" } as SiteSettings["socials"] }), updatedBy: "o" });
    expect(saved[0]?.socials).toEqual({ facebook: "https://facebook.com/hulol" });
  });
  it("reads a stored document defensively", () => {
    expect(fromStored(undefined)).toEqual(EMPTY_SITE_SETTINGS);
    expect(fromStored({ whatsappNumber: 5, email: "a@b.co", socials: { instagram: "javascript:x", x: "https://x.com/a" } })).toEqual({ whatsappNumber: "", phoneDisplay: "", email: "a@b.co", socials: { x: "https://x.com/a" } });
  });
});
