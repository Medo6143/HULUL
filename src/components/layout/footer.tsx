import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { segments } from "@/config/segments";
import { services } from "@/config/services";
import { ConsentReopen } from "@/components/layout/consent-reopen";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  const brand = await getTranslations("brand");
  const serviceCopy = await getTranslations("services");
  const segmentCopy = await getTranslations("segments");

  const column = "grid content-start gap-3";
  const heading = "mb-4 text-[16px] font-bold text-surface";
  const link = "motion-safe:transition-colors hover:text-surface";

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-[15px] leading-[1.6] text-surface/70">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      <div className="ms-auto me-auto grid max-w-page gap-10 py-16 ps-4 pe-4 md:grid-cols-2 md:ps-6 md:pe-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-4 text-surface">
            <Image
              src="/icons/nav-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-[20px] font-bold">{brand("name")}</span>
          </Link>
          <p className="mt-4 max-w-xs">{t("blurb")}</p>
        </div>
        <div className={column}>
          <h2 className={heading}>{t("services")}</h2>
          <ul className="grid gap-3">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className={link}>
                  {serviceCopy(`${service.slug}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={column}>
          <h2 className={heading}>{t("segments")}</h2>
          <ul className="grid gap-3">
            {segments.map((segment) => (
              <li key={segment.slug}>
                <Link href={`/for/${segment.slug}`} className={link}>
                  {segmentCopy(`${segment.slug}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={column}>
          <h2 className={heading}>{t("company")}</h2>
          <ul className="grid gap-3">
            <li>
              <Link href="/about" className={link}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className={link}>
                {t("faq")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={link}>
                {t("contact")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={link}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={link}>
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href="/cookies" className={link}>
                {t("cookies")}
              </Link>
            </li>
            <li>
              <ConsentReopen className={`${link} text-start`} />
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-surface/10 py-5 text-center">
        <bdi>2026</bdi> {t("rights")}
      </p>
    </footer>
  );
}
