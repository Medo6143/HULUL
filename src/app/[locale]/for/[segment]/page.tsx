import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SceneCard } from "@/components/illustrations/scenes";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClassName } from "@/components/ui/button";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCta } from "@/components/sections/final-cta";
import { JourneySection } from "@/components/sections/journey-section";
import { ServicesSection } from "@/components/sections/services-section";
import { isSegmentSlug, segments } from "@/config/segments";
import { Link } from "@/i18n/navigation";
import { whatsappHref } from "@/lib/whatsapp-href";

export function generateStaticParams() {
  return segments.map((segment) => ({ segment: segment.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; segment: string }>;
}) {
  const { locale, segment } = await params;
  if (!isSegmentSlug(segment)) return {};
  const t = await getTranslations({ locale, namespace: "segments" });
  return { title: t(`${segment}.name`) };
}

export default async function SegmentPage({
  params,
}: {
  params: Promise<{ locale: string; segment: string }>;
}) {
  const { locale, segment } = await params;
  if (!isSegmentSlug(segment)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("segments");
  const config = segments.find((s) => s.slug === segment)!;

  return (
    <main id="main">
      <PageHero
        eyebrow={t(`${segment}.name`)}
        title={t(`${segment}.title`)}
        intro={t(`${segment}.promise`)}
        aside={<SceneCard variant={segment} />}
        actions={
          <Link href="/start" className={buttonClassName("primary", "min-h-14")}>
            {t("cta")}
            <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        }
      />
      <ServicesSection />
      <JourneySection />
      <FaqSection />
      <FinalCta whatsappHref={whatsappHref(locale, config.whatsappContext)} />
    </main>
  );
}
