import { useTranslations } from "next-intl";
import { CountUp } from "@/components/motion/count-up";
import { GrowBar } from "@/components/motion/grow-bar";
import { Reveal } from "@/components/motion/reveal";
import { adReach, marketSources, marketStats } from "@/config/market-data";
import { Section, SectionHeading } from "./section";

export function MarketSection() {
  const t = useTranslations("home.market");
  const max = Math.max(...adReach.map((p) => p.value));

  return (
    <Section id="market" tone="muted" labelledBy="market-title">
      <SectionHeading id="market-title" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

      <ul className="grid gap-6 md:grid-cols-3">
        {marketStats.map((stat, index) => (
          <Reveal as="li" key={stat.key} delay={index * 120} className="rounded-card border border-surface-line bg-surface p-8">
            <p className="text-[48px] font-bold leading-none text-ink-900 md:text-[56px]">
              <CountUp to={stat.value} decimals={stat.decimals} />
              <span className="ms-1 text-[22px] font-semibold text-brand-strong">
                {t(stat.unit === "percent" ? "unitPercent" : "unitMillion")}
              </span>
            </p>
            <p className="mt-3 text-[17px] font-semibold leading-[1.6]">{t(`stats.${stat.key}`)}</p>
            <p className="mt-1 text-[14px] text-text-muted" dir="ltr">
              {marketSources[stat.source]}
            </p>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-8 rounded-card border border-surface-line bg-surface p-8">
        <h3 className="text-[20px] font-bold">{t("chartTitle")}</h3>
        <p className="mb-6 mt-1 text-[14px] text-text-muted">{t("chartHint")}</p>
        <ul className="grid gap-5">
          {adReach.map((platform, index) => (
            <li key={platform.name} className="grid gap-2">
              <span className="flex items-center justify-between text-[16px]">
                <span dir="ltr" className="font-semibold">
                  {platform.name}
                </span>
                <b className="tabular-nums">
                  <bdi>{platform.value}</bdi>
                </b>
              </span>
              <GrowBar
                percent={(platform.value / max) * 100}
                delay={index * 90}
                className="bg-gradient-to-r from-brand-strong to-brand"
              />
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px] text-text-muted" dir="ltr">
          {marketSources.datareportal}
        </p>
      </Reveal>
    </Section>
  );
}
