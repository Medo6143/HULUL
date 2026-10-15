import "server-only";
import { unstable_cache } from "next/cache";
import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/features/site-settings";
import { EMPTY_SITE_SETTINGS } from "@/features/site-settings";
import { container } from "@/lib/container";
import { publicEnv } from "@/lib/env.public";
import { buildWaLink, type WaContext } from "@/lib/whatsapp";

export const SITE_SETTINGS_TAG = "site-settings";

const cachedSettings = unstable_cache(async () => (await container.getSiteSettings())(), ["site-settings"], {
  tags: [SITE_SETTINGS_TAG],
  revalidate: 300,
});

export interface ResolvedSite {
  whatsappNumber: string;
  phoneDisplay: string;
  email: string;
  socials: SiteSettings["socials"];
}

/**
 * The contact details the public site shows: what the owner saved in the admin, falling back to the environment
 * and static config when a value is empty or Firestore cannot be read (failures are not cached).
 */
export async function loadSite(): Promise<ResolvedSite> {
  let saved: SiteSettings;
  try {
    saved = await cachedSettings();
  } catch {
    saved = EMPTY_SITE_SETTINGS;
  }
  return {
    whatsappNumber: saved.whatsappNumber || publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    phoneDisplay: saved.phoneDisplay || siteConfig.phoneDisplay || "",
    email: saved.email || siteConfig.email || "",
    socials: saved.socials,
  };
}

/** Pre-filled WhatsApp link for the page, or null while no valid number is set. */
export async function getWhatsappHref(locale: string, context: WaContext = "general"): Promise<string | null> {
  const site = await loadSite();
  return buildWaLink({ phone: site.whatsappNumber, locale: locale === "en" ? "en" : "ar", context });
}
