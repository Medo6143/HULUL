import { publicEnv } from "./env.public";
import { buildWaLink, type WaContext } from "./whatsapp";

/** Pre-filled WhatsApp link for the page, or null while the official number is not configured. */
export function whatsappHref(locale: string, context: WaContext = "general"): string | null {
  return buildWaLink({
    phone: publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    locale: locale === "en" ? "en" : "ar",
    context,
  });
}
