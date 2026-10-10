import { getTranslations, setRequestLocale } from "next-intl/server";
import { RequestPage } from "../request-page";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "start" });
  return pageMetadata({ locale, path: "/start", title: t("title"), description: t("intro") });
}

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RequestPage locale={locale} type="project" />;
}
