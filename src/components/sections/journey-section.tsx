import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { processSteps } from "@/config/process";
import { Section, SectionHeading } from "./section";

// Durations are deliberately absent: they are not confirmed (see MISSING_CONTENT.md).
export function JourneySection() {
  const t = useTranslations("processPage");
  const h = useTranslations("home.journey");

  return (
    <Section id="journey" tone="dark" labelledBy="journey-title">
      <SectionHeading id="journey-title" eyebrow={h("eyebrow")} title={h("title")} intro={h("intro")} dark />
      <ol className="grid gap-4 md:grid-cols-5">
        {processSteps.map((step, index) => (
          <Reveal
            as="li"
            key={step.id}
            delay={index * 120}
            className="relative overflow-hidden rounded-card border border-surface/10 bg-surface/5 p-6 backdrop-blur hover:border-brand/40 hover:bg-surface/10"
          >
            <span
              aria-hidden="true"
              className="text-[56px] font-bold leading-none text-gradient"
            >
              <bdi>{`0${index + 1}`}</bdi>
            </span>
            <h3 className="mt-4 text-[19px] font-bold leading-[1.4]">{t(`${step.id}.title`)}</h3>
            <p className="mt-2 text-[15px] leading-[1.75] text-surface/75">{t(`${step.id}.text`)}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
