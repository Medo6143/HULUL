import { ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SceneCard } from "@/components/illustrations/scenes";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClassName } from "@/components/ui/button";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCta } from "@/components/sections/final-cta";
import { JourneySection } from "@/components/sections/journey-section";
import { Section, SectionHeading } from "@/components/sections/section";
import { findService, isServiceSlug, services } from "@/config/services";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { publicEnv } from "@/lib/env.public";
import { faqSchema, serviceSchema } from "@/lib/structured-data";
import { whatsappHref } from "@/lib/whatsapp-href";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { pageMetadata } from "@/lib/page-metadata";

const POINTS = ["p1", "p2", "p3"] as const;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: "services" });
  return pageMetadata({
    locale,
    path: `/services/${slug}`,
    title: t(`${slug}.title`),
    description: t(`${slug}.summary`),
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const h = await getTranslations("home.services");
  const d = await getTranslations("serviceDetail");
  const nav = await getTranslations("nav");
  const href = whatsappHref(locale, slug);
  const brand = await getTranslations("brand");
  const config = findService(slug)!;
  const key = locale === "en" ? "en" : "ar";

  return (
    <main id="main">
      <JsonLd
        data={serviceSchema({
          base: publicEnv.NEXT_PUBLIC_SITE_URL,
          locale: locale === "en" ? "en" : "ar",
          path: `/services/${slug}`,
          name: t(`${slug}.title`),
          description: t(`${slug}.summary`),
          providerName: brand("name"),
        })}
      />
      {config.faq.length > 0 ? (
        <JsonLd data={faqSchema(config.faq.map((item) => ({ question: item.q[key], answer: item.a[key] })))} />
      ) : null}
      <PageHero
        eyebrow={nav("services")}
        title={t(`${slug}.title`)}
        intro={t(`${slug}.summary`)}
        actions={
          <>
            <Link href="/start" data-track="cta_click" data-track-location="service_hero" className={buttonClassName("primary", "min-h-14")}>
              {d("cta")}
              <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("ghost", "min-h-14")}
              >
                <WhatsAppIcon className="size-5" aria-hidden="true" />
                {d("whatsapp")}
              </a>
            ) : null}
          </>
        }
        aside={<SceneCard variant={slug} />}
      />
      <Section labelledBy="offer-title">
        <SectionHeading id="offer-title" eyebrow={t(`${slug}.title`)} title={d("offerTitle")} />
        <ul className="grid gap-6 md:grid-cols-3">
          {POINTS.map((p) => (
            <li
              key={p}
              className="rounded-card border border-surface-line bg-surface p-8 motion-safe:transition hover:-translate-y-1 hover:shadow-card"
            >
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-brand-soft text-ink-900">
                <Check className="size-6" aria-hidden="true" />
              </span>
              <p className="text-[19px] font-semibold leading-[1.6]">{h(`${slug}.${p}`)}</p>
            </li>
          ))}
        </ul>
      </Section>
      {config.deliverables.length > 0 ? (
        <Section tone="muted" labelledBy="deliverables-title">
          <SectionHeading id="deliverables-title" eyebrow={t(`${slug}.title`)} title={d("deliverablesTitle")} />
          <ul className="ms-auto me-auto grid max-w-3xl gap-3">
            {config.deliverables.map((item) => (
              <li key={item.ar} className="flex items-start gap-3 rounded-card border border-surface-line bg-surface p-5 text-[17px]">
                <Check className="mt-1 size-5 shrink-0 text-brand-strong" aria-hidden="true" />
                {item[key]}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <JourneySection />
      {config.faq.length > 0 ? (
        <Section labelledBy="service-faq-title">
          <SectionHeading id="service-faq-title" eyebrow={t(`${slug}.title`)} title={d("faqTitle")} />
          <div className="ms-auto me-auto grid max-w-3xl gap-4">
            {config.faq.map((item) => (
              <details key={item.q.ar} className="rounded-card border border-surface-line bg-surface ps-6 pe-6 py-5">
                <summary className="min-h-11 cursor-pointer text-[18px] font-semibold">{item.q[key]}</summary>
                <p className="mt-3 text-[16px] leading-[1.8] text-text-muted">{item.a[key]}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : (
        <FaqSection />
      )}
      <FinalCta whatsappHref={href} />
    </main>
  );
}
