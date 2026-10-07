import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { Section } from "@/components/sections/section";
import { ServicesGrid } from "@/components/sections/services-section";
import { whatsappHref } from "@/lib/whatsapp-href";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return { title: t("title") };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const nav = await getTranslations("nav");

  return (
    <main id="main">
      <PageHero eyebrow={nav("services")} title={t("title")} intro={t("intro")} />
      <Section tone="muted">
        <ServicesGrid />
      </Section>
      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
