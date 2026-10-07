import { getTranslations, setRequestLocale } from "next-intl/server";
import { RequestPage } from "../request-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "start" });
  return { title: t("title") };
}

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RequestPage locale={locale} type="project" />;
}
