import { Eye, FileText, Handshake, Languages, MapPin, type LucideIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DevicesArt, SkylineArt, TeamScene } from "@/components/illustrations/about-art";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { JourneySection } from "@/components/sections/journey-section";
import { Section, SectionHeading } from "@/components/sections/section";
import { ServicesGrid } from "@/components/sections/services-section";
import { whatsappHref } from "@/lib/whatsapp-href";

const VALUES: { key: "clarity" | "arabic" | "visibility" | "support"; Icon: LucideIcon }[] = [
  { key: "clarity", Icon: FileText },
  { key: "arabic", Icon: Languages },
  { key: "visibility", Icon: Eye },
  { key: "support", Icon: Handshake },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const nav = await getTranslations("footer");

  return (
    <main id="main">
      <PageHero eyebrow={nav("about")} title={t("title")} intro={t("body")} aside={<TeamScene />} />

      <Section labelledBy="about-story">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full bg-brand-soft py-1.5 ps-4 pe-4 text-[15px] font-semibold text-ink-900">
              {t("storyEyebrow")}
            </p>
            <h2 id="about-story" className="mt-4 text-[28px] font-bold leading-[1.3] md:text-[40px]">
              {t("storyTitle")}
            </h2>
            <p className="mt-4 text-[17px] leading-[1.9] text-text-muted">{t("storyP1")}</p>
            <p className="mt-4 text-[17px] leading-[1.9] text-text-muted">{t("storyP2")}</p>
          </div>
          <div className="overflow-hidden rounded-panel border border-surface-line shadow-card">
            <DevicesArt />
          </div>
        </div>
      </Section>

      <Section tone="muted" labelledBy="about-values">
        <SectionHeading id="about-values" eyebrow={t("valuesEyebrow")} title={t("valuesTitle")} intro={t("valuesIntro")} />
        <ul className="grid gap-6 md:grid-cols-2">
          {VALUES.map(({ key, Icon }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 100}
              className="flex gap-5 rounded-card border border-surface-line bg-surface p-7 hover:-translate-y-1 hover:shadow-card"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-ink-950">
                <Icon className="size-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[20px] font-bold leading-[1.4]">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 text-[16px] leading-[1.8] text-text-muted">{t(`values.${key}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section labelledBy="about-scope">
        <SectionHeading id="about-scope" eyebrow={t("pillarsEyebrow")} title={t("pillarsTitle")} />
        <ServicesGrid />
      </Section>

      <JourneySection />

      <Section tone="muted" labelledBy="about-location">
        <div className="relative isolate ms-auto me-auto max-w-4xl overflow-hidden rounded-panel border border-surface-line bg-gradient-to-br from-brand-soft to-surface">
          <SkylineArt className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 w-full opacity-20" />
          <div className="flex items-center gap-5 p-8 pb-24 md:p-12 md:pb-28">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink-900 text-brand">
              <MapPin className="size-8" aria-hidden="true" />
            </span>
            <div>
              <h2 id="about-location" className="text-[24px] font-bold">
                {t("locationTitle")}
              </h2>
              <p className="mt-1 text-[17px] text-text-muted">{t("locationBody")}</p>
            </div>
          </div>
        </div>
      </Section>

      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
