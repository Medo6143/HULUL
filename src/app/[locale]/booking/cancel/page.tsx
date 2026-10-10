import { getTranslations, setRequestLocale } from "next-intl/server";
import { CancelBooking } from "@/components/booking/cancel-booking";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/sections/section";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.cancel" });
  return pageMetadata({ locale, path: "/booking/cancel", title: t("title"), noindex: true });
}

export default async function CancelBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ b?: string; t?: string }>;
}) {
  const { locale } = await params;
  const { b, t: token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("booking.cancel");
  return (
    <main id="main">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />
      <Section tone="muted">
        <div className="ms-auto me-auto max-w-xl rounded-card border border-surface-line bg-surface p-8">
          <CancelBooking id={b ?? ""} token={token ?? ""} />
        </div>
      </Section>
    </main>
  );
}
