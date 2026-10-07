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
import { isServiceSlug, services } from "@/config/services";
import { Link } from "@/i18n/navigation";
import { whatsappHref } from "@/lib/whatsapp-href";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

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
  return { title: t(`${slug}.title`) };
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

  return (
    <main id="main">
      <PageHero
        eyebrow={nav("services")}
        title={t(`${slug}.title`)}
        intro={t(`${slug}.summary`)}
        actions={
          <>
            <Link href="/start" className={buttonClassName("primary", "min-h-14")}>
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
      <JourneySection />
      <FaqSection />
      <FinalCta whatsappHref={href} />
    </main>
  );
}
