import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SaudiMan } from "@/components/illustrations/people";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function FinalCta({ whatsappHref }: { whatsappHref: string | null }) {
  const t = useTranslations("home.final");

  return (
    <section aria-labelledby="final-title" className="bg-surface py-16 md:py-24">
      <div className="ms-auto me-auto max-w-page ps-4 pe-4 md:ps-6 md:pe-6">
        <div className="relative isolate overflow-hidden rounded-panel bg-gradient-to-br from-ink-900 via-ink-900 to-[#0b5566] px-6 py-14 text-surface md:px-14 md:py-16">
          <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10 opacity-50" />
          <div
            aria-hidden="true"
            className="absolute -top-24 end-10 -z-10 size-72 rounded-full bg-brand/25 blur-[100px]"
          />
          <div className="max-w-xl">
            <h2 id="final-title" className="text-[28px] font-bold leading-[1.3] md:text-[40px]">
              {t("title")}
            </h2>
            <p className="mt-4 text-[17px] leading-[1.8] text-surface/80">{t("text")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className={buttonClassName("primary", "min-h-14")}>
                {t("cta")}
                <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName("whatsapp", "min-h-14")}
                >
                  <WhatsAppIcon className="size-5" aria-hidden="true" />
                  {t("whatsapp")}
                </a>
              ) : null}
            </div>
          </div>
          <SaudiMan
            className="pointer-events-none absolute bottom-0 end-10 hidden h-[88%] drop-shadow-2xl md:block"
          />
        </div>
      </div>
    </section>
  );
}
