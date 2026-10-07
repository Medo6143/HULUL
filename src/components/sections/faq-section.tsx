import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeading } from "./section";

const ITEMS = ["1", "2", "3"] as const;

export function FaqSection() {
  const t = useTranslations("home.faq");

  return (
    <Section labelledBy="faq-title">
      <SectionHeading id="faq-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="ms-auto me-auto grid max-w-3xl gap-4">
        {ITEMS.map((n, index) => (
          <Reveal key={n} delay={index * 100}>
          <details
            className="group rounded-card border border-surface-line bg-surface ps-6 pe-6 py-5 motion-safe:transition open:border-brand-strong/50 open:shadow-card"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-semibold [&::-webkit-details-marker]:hidden">
              {t(`q${n}`)}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-ink-900">
                <Plus
                  className="size-5 motion-safe:transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </span>
            </summary>
            <p className="mt-3 text-[16px] leading-[1.8] text-text-muted">{t(`a${n}`)}</p>
          </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
