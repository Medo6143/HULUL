import { setRequestLocale } from "next-intl/server";
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const whatsappHref = buildWaLink({
    phone: publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    locale: locale === "en" ? "en" : "ar",
    context: "general",
  });

  return (
    <main id="main">
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
