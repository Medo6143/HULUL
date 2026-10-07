import { ArrowRight, Check, Globe, PenTool, Smartphone, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { SceneCard } from "@/components/illustrations/scenes";
import { services, type ServiceSlug } from "@/config/services";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeading } from "./section";

export const serviceIcons: Record<ServiceSlug, LucideIcon> = {
  web: Globe,
  mobile: Smartphone,
  design: PenTool,
};
const POINTS = ["p1", "p2", "p3"] as const;

export function ServicesGrid() {
  const t = useTranslations("services");
  const h = useTranslations("home.services");

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {services.map(({ slug }, index) => {
        const Icon = serviceIcons[slug];
        return (
          <Reveal
            as="article"
            key={slug}
            delay={index * 120}
            className="group relative flex flex-col overflow-hidden rounded-card border border-surface-line bg-surface p-8 hover:-translate-y-1 hover:border-brand-strong/50 hover:shadow-card"
          >
            <SceneCard variant={slug} className="mb-6 rounded-2xl" />
            <span
              aria-hidden="true"
              className="absolute end-6 top-5 text-[64px] font-bold leading-none text-surface/30"
            >
              <bdi>{`0${index + 1}`}</bdi>
            </span>
            <div className="relative mb-6 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-ink-950 shadow-[0_10px_24px_rgb(0_169_209/0.35)]">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <h3 className="text-[22px] font-bold leading-[1.4] md:text-[26px]">{t(`${slug}.title`)}</h3>
            <p className="mb-5 mt-2 text-[16px] leading-[1.7] text-text-muted">{t(`${slug}.summary`)}</p>
            <ul className="mb-6 grid gap-3 text-[16px]">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-ink-900">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {h(`${slug}.${p}`)}
                </li>
              ))}
            </ul>
            <Link
              href={`/services/${slug}`}
              className="mt-auto inline-flex min-h-11 items-center gap-2 font-semibold text-ink-900"
            >
              {t("more")}
              <ArrowRight
                className="size-[18px] motion-safe:transition-transform rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

export function ServicesSection() {
  const t = useTranslations("services");
  const h = useTranslations("home.services");

  return (
    <Section id="services" labelledBy="services-title">
      <SectionHeading id="services-title" eyebrow={h("eyebrow")} title={h("title")} intro={t("intro")} />
      <ServicesGrid />
    </Section>
  );
}
