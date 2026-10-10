import { ArrowRight, Blocks, Clock, Layers, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeading } from "./section";

const FACTORS: { key: "scope" | "complexity" | "time"; Icon: LucideIcon }[] = [
  { key: "scope", Icon: Layers },
  { key: "complexity", Icon: Blocks },
  { key: "time", Icon: Clock },
];

export function CostSection() {
  const t = useTranslations("home.cost");

  return (
    <div data-track-view="cost_section_view" data-track-location="cost">
<Section tone="muted" labelledBy="cost-title">
      <SectionHeading id="cost-title" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <div className="grid gap-6 md:grid-cols-3">
        {FACTORS.map(({ key, Icon }, index) => (
          <Reveal
            key={key}
            delay={index * 120}
            className="rounded-card border border-surface-line bg-surface p-8 hover:-translate-y-1 hover:shadow-card"
          >
            <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-ink-900 text-brand">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <h3 className="text-[21px] font-bold leading-[1.4]">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-[16px] leading-[1.75] text-text-muted">{t(`${key}.text`)}</p>
          </Reveal>
        ))}
      </div>
      <p className="ms-auto me-auto mt-10 max-w-2xl text-center text-[17px] text-text-muted">{t("note")}</p>
      <p className="mt-6 text-center">
        <Link href="/start" data-track="cta_click" className={buttonClassName("primary", "min-h-14")}>
          {t("cta")}
          <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </p>
    </Section>
    </div>
  );
}
