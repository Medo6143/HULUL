import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/layout/page-shell";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata({ locale, path: "/cookies", title: t("cookiesTitle"), noindex: true });
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return (
    <PageShell title={t("cookiesTitle")}>
      <p>{t("pending")}</p>
    </PageShell>
  );
}
