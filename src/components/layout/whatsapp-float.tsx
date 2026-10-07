"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { buildWaLink, contextFromPath, type WaLocale } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function WhatsAppFloat({ phone }: { phone: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("whatsapp");
  const safeLocale: WaLocale = locale === "en" ? "en" : "ar";
  const href = buildWaLink({
    phone,
    locale: safeLocale,
    context: contextFromPath(pathname),
  });

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 start-6 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-whatsapp ps-4 pe-4 font-bold text-ink-950 shadow-card"
    >
      <WhatsAppIcon className="size-7" aria-hidden="true" />
      <span className="max-md:sr-only">{t("float")}</span>
    </a>
  );
}
