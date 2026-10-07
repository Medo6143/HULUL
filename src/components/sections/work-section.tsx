import { useLocale, useTranslations } from "next-intl";
import { caseStudies } from "@/config/case-studies";
import { Section, SectionHeading } from "./section";

// Hidden until real, permitted case studies exist.
export function WorkSection() {
  const t = useTranslations("home.work");
  const s = useTranslations("services");
  const locale = useLocale() === "en" ? "en" : "ar";

  if (caseStudies.length === 0) return null;

  return (
    <Section id="work" tone="muted" labelledBy="work-title">
      <SectionHeading id="work-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid gap-6 md:grid-cols-3">
        {caseStudies.map((study) => (
          <article key={study.slug} className="rounded-card border border-surface-line bg-surface p-7">
            <p className="text-[15px] text-text-muted">{s(`${study.category}.title`)}</p>
            <h3 className="mt-1 text-[20px] font-semibold leading-[1.4]">{study.title[locale]}</h3>
            <p className="mt-3 font-bold text-ink-900">{study.result[locale]}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
