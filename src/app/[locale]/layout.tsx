import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { container } from "@/lib/container";
import { ArabicDocument } from "./arabic-document";
import { LatinDocument } from "./latin-document";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(container.env.NEXT_PUBLIC_SITE_URL),
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("description"),
    icons: {
      icon: [
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const phone = container.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const env = container.env;
  const analyticsIds = {
    ga4: env.NEXT_PUBLIC_GA4_ID,
    clarity: env.NEXT_PUBLIC_CLARITY_ID,
    meta: env.NEXT_PUBLIC_META_PIXEL_ID,
    snap: env.NEXT_PUBLIC_SNAP_PIXEL_ID,
    tiktok: env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
  };
  const documentProps = { locale, messages, phone, analyticsIds, children };

  if (locale === "ar") return <ArabicDocument {...documentProps} />;
  return <LatinDocument {...documentProps} />;
}
