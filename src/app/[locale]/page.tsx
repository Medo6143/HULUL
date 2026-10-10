import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { faqSchema, organizationSchema, websiteSchema } from "@/lib/structured-data";
import { ConsultSection } from "@/components/sections/consult-section";
import { ContactSection } from "@/components/sections/contact-section";
import { CostSection } from "@/components/sections/cost-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { MarketSection } from "@/components/sections/market-section";
import { JourneySection } from "@/components/sections/journey-section";
import { ServicesSection } from "@/components/sections/services-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { TrustBar } from "@/components/sections/trust-bar";
import { WorkSection } from "@/components/sections/work-section";
import { ContactForm } from "@/features/contact";
import { publicEnv } from "@/lib/env.public";
import { buildWaLink } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  return pageMetadata({ locale, path: "/", description: t("subtitle") });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const faq = await getTranslations("home.faq");
  const brand = await getTranslations("brand");
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const seoLocale = locale === "en" ? "en" : "ar";

  const whatsappHref = buildWaLink({
    phone: publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    locale: locale === "en" ? "en" : "ar",
    context: "general",
  });

  return (
    <main id="main">
      <JsonLd data={organizationSchema({ base, name: brand("name") })} />
      <JsonLd data={websiteSchema({ base, name: brand("name"), locale: seoLocale })} />
      <JsonLd
        data={faqSchema(
          (["1", "2", "3"] as const).map((n) => ({ question: faq(`q${n}`), answer: faq(`a${n}`) })),
        )}
      />
      <Hero whatsappHref={whatsappHref} />
      <TrustBar />
      <ServicesSection />
      <MarketSection />
      <WorkSection />
      <TestimonialsSection />
      <JourneySection />
      <CostSection />
      <ConsultSection whatsappHref={whatsappHref} />
      <FaqSection />
      <ContactSection
        whatsappHref={whatsappHref}
        whatsappNumber={publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER}
        form={<ContactForm />}
      />
      <FinalCta whatsappHref={whatsappHref} />
    </main>
  );
}
