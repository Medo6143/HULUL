import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCta } from "@/components/sections/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { faqSchema } from "@/lib/structured-data";
import { whatsappHref } from "@/lib/whatsapp-href";

const ITEMS = ["1", "2", "3"] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return pageMetadata({ locale, path: "/faq", title: t("title"), description: t("intro") });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const faq = await getTranslations("home.faq");
  return (
    <main id="main">
      <JsonLd data={faqSchema(ITEMS.map((n) => ({ question: faq(`q${n}`), answer: faq(`a${n}`) })))} />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <FaqSection />
      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
