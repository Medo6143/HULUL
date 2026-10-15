import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { ContactSection } from "@/components/sections/contact-section";
import { ContactForm } from "@/features/contact";
import { loadSite } from "@/app/_lib/site";
import { pageMetadata } from "@/lib/page-metadata";
import { getWhatsappHref } from "@/app/_lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return pageMetadata({ locale, path: "/contact", title: t("title"), description: t("intro") });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const site = await loadSite();
  return (
    <main id="main">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <ContactSection
        whatsappHref={await getWhatsappHref(locale)}
        whatsappNumber={site.whatsappNumber}
        phoneDisplay={site.phoneDisplay}
        email={site.email}
        form={<ContactForm />}
      />
    </main>
  );
}
