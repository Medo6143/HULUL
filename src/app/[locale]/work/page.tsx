import { FolderOpen } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SceneCard } from "@/components/illustrations/scenes";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { Section } from "@/components/sections/section";
import { WorkSection } from "@/components/sections/work-section";
import { caseStudies } from "@/config/case-studies";
import { whatsappHref } from "@/lib/whatsapp-href";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return { title: t("title") };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("work");

  return (
    <main id="main">
      <PageHero eyebrow={t("title")} title={t("heading")} aside={<SceneCard variant="work" />} />
      {caseStudies.length > 0 ? (
        <WorkSection />
      ) : (
        <Section tone="muted">
          <div className="ms-auto me-auto grid max-w-2xl justify-items-center gap-4 rounded-panel border border-dashed border-text-muted/30 bg-surface p-10 text-center md:p-14">
            <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-ink-900">
              <FolderOpen className="size-8" aria-hidden="true" />
            </span>
            <h2 className="text-[22px] font-bold">{t("emptyTitle")}</h2>
            <p className="text-text-muted">{t("emptyBody")}</p>
          </div>
        </Section>
      )}
      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
