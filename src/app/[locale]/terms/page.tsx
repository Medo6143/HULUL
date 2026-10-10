import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { PageShell } from "@/components/layout/page-shell";
import { legalSections } from "@/config/legal";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata({ locale, path: "/terms", title: t("termsTitle"), noindex: true });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return (
    <PageShell title={t("termsTitle")}>
      <LegalDocument banner={t("pending")} sections={legalSections("terms", locale === "en" ? "en" : "ar")} />
    </PageShell>
  );
}
