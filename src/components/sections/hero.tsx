import { ArrowRight, Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeroScene } from "@/components/illustrations/hero-scene";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function Hero({ whatsappHref }: { whatsappHref: string | null }) {
  const t = useTranslations("hero");

  return (
    <header className="relative isolate overflow-hidden bg-ink-950 pb-16 pt-14 text-surface md:pb-24 md:pt-20">
      <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-32 end-[-6rem] -z-10 size-[520px] rounded-full bg-brand/20 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-8rem] start-[-6rem] -z-10 size-[420px] rounded-full bg-brand-strong/20 blur-[130px]"
      />
      <div className="ms-auto me-auto grid max-w-page items-center gap-12 ps-4 pe-4 md:ps-6 md:pe-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface/10 bg-surface/5 py-1.5 ps-4 pe-4 text-[15px] text-brand backdrop-blur">
            <MapPin className="size-[18px]" aria-hidden="true" />
            {t("badge")}
          </p>
          <h1 className="max-w-3xl text-[34px] font-bold leading-[1.25] md:text-[56px]">
            {t.rich("title", { em: (chunks) => <em className="text-gradient not-italic">{chunks}</em> })}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.8] text-surface/75 md:text-[19px]">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/start" className={buttonClassName("primary", "min-h-14 text-[17px]")}>
              {t("ctaPrimary")}
              <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("ghost", "min-h-14 text-[17px]")}
              >
                <WhatsAppIcon className="size-5" aria-hidden="true" />
                {t("ctaWhatsapp")}
              </a>
            ) : null}
          </div>
          <ul className="mt-8 flex flex-wrap gap-3 text-[15px] text-surface/80">
            {(["promise2", "promise3"] as const).map((key) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-surface/10 bg-surface/5 py-2 ps-4 pe-4"
              >
                <Check className="size-[18px] text-brand" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <HeroScene />
      </div>
    </header>
  );
}
