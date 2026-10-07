import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SceneCard } from "@/components/illustrations/scenes";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { Section } from "@/components/sections/section";
import { processSteps } from "@/config/process";
import { whatsappHref } from "@/lib/whatsapp-href";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "processPage" });
  return { title: t("title") };
}

export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("processPage");
  const nav = await getTranslations("nav");

  return (
    <main id="main">
      <PageHero
        eyebrow={nav("process")}
        title={t("title")}
        intro={t("intro")}
        aside={<SceneCard variant="process" />}
      />
      <Section tone="muted">
        <ol className="ms-auto me-auto grid max-w-3xl gap-0">
          {processSteps.map((step, index) => (
            <Reveal as="li" key={step.id} delay={index * 100} className="relative flex gap-5 pb-10 last:pb-0">
              {index < processSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute start-6 top-14 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-brand-strong to-surface-line rtl:translate-x-1/2"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-900 text-[18px] font-bold text-brand"
              >
                <bdi>{index + 1}</bdi>
              </span>
              <div className="flex-1 rounded-card border border-surface-line bg-surface p-6 motion-safe:transition hover:shadow-card">
                <h2 className="text-[21px] font-bold leading-[1.4]">{t(`${step.id}.title`)}</h2>
                <p className="mt-2 text-[16px] leading-[1.8] text-text-muted">{t(`${step.id}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>
      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
