import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { ContactSection } from "@/components/sections/contact-section";
import { ContactForm } from "@/features/contact";
import { publicEnv } from "@/lib/env.public";
import { pageMetadata } from "@/lib/page-metadata";
import { whatsappHref } from "@/lib/whatsapp-href";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return pageMetadata({ locale, path: "/contact", title: t("title"), description: t("intro") });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  return (
    <main id="main">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <ContactSection
        whatsappHref={whatsappHref(locale)}
        whatsappNumber={publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER}
        form={<ContactForm />}
      />
    </main>
  );
}
