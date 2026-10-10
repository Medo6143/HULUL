import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { SaudiMan, SaudiWoman } from "@/components/illustrations/people";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Section } from "./section";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

const POINTS = ["p1", "p2", "p3"] as const;

/** Points the visitor to the dedicated form page (/start). The form itself lives only there. */
export function ConsultSection({ whatsappHref }: { whatsappHref: string | null }) {
  const t = useTranslations("home.consult");

  return (
    <div data-track-location="consult">
<Section id="consult" tone="dark" labelledBy="consult-title">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 id="consult-title" className="text-[28px] font-bold leading-[1.3] md:text-[40px]">
            {t("title")}
          </h2>
          <p className="mt-4 text-[17px] leading-[1.8] text-surface/75">{t("intro")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/start" data-track="cta_click" className={buttonClassName("primary", "min-h-14")}>
              {t("formCta")}
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
                {t("whatsappCta")}
              </a>
            ) : null}
          </div>
        </div>
        <div className="overflow-hidden rounded-panel bg-surface text-text shadow-[0_30px_80px_rgb(0_0_0/0.45)]">
          <div aria-hidden="true" className="relative h-52 bg-gradient-to-t from-brand-soft to-surface">
            <SaudiWoman className="absolute bottom-0 start-[16%] h-[94%]" />
            <SaudiMan shemagh="red" className="absolute bottom-0 end-[16%] h-[94%]" />
          </div>
          <div className="p-7 md:p-9">
            <h3 className="text-[20px] font-bold">{t("panelTitle")}</h3>
            <ul className="mt-4 grid gap-3">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[16px]">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-ink-950">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {t(p)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
    </div>
  );
}
