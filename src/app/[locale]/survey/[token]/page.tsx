import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/sections/section";
import { SurveyForm } from "@/features/surveys";
import { container } from "@/lib/container";
import { pageMetadata } from "@/lib/page-metadata";

// Always rendered fresh: it depends on the survey's current state, and it must never be indexed.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "survey" });
  return { ...pageMetadata({ locale, path: "/survey", title: t("title"), noindex: true }), robots: { index: false, follow: false } };
}

export default async function SurveyPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const lookup = await container.getSurveyForPage();
  const survey = await lookup(token).catch(() => null);
  if (!survey) notFound();
  const t = await getTranslations("survey");
  const key = locale === "en" ? "en" : "ar";

  return (
    <main id="main">
      <PageHero eyebrow={t("eyebrow")} title={t("heading", { project: survey.projectTitle[key] || survey.projectTitle.ar })} intro={t("intro", { name: survey.clientName })} />
      <Section tone="muted">
        <div className="ms-auto me-auto max-w-2xl rounded-card border border-surface-line bg-surface p-6 shadow-card md:p-10">
          <SurveyForm token={token} clientName={survey.clientName} answered={survey.answered} />
        </div>
      </Section>
    </main>
  );
}
