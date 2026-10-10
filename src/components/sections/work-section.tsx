import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeading } from "./section";

export interface WorkItem {
  slug: string;
  category: "web" | "mobile" | "design";
  title: { ar: string; en: string };
  result: { ar: string; en: string };
}

// Hidden until real, permitted case studies exist.
export function WorkSection({ items }: { items: readonly WorkItem[] }) {
  const t = useTranslations("home.work");
  const s = useTranslations("services");
  const more = useTranslations("work");
  const locale = useLocale() === "en" ? "en" : "ar";

  if (items.length === 0) return null;

  return (
    <Section id="work" tone="muted" labelledBy="work-title">
      <SectionHeading id="work-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((study) => (
          <article key={study.slug} className="rounded-card border border-surface-line bg-surface p-7">
            <p className="text-[15px] text-text-muted">{s(`${study.category}.title`)}</p>
            <h3 className="mt-1 text-[20px] font-semibold leading-[1.4]">{study.title[locale]}</h3>
            <p className="mt-3 font-bold text-ink-900">{study.result[locale]}</p>
            <Link
              href={`/work/${study.slug}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-ink-900"
            >
              {more("readCase")}
              <ArrowRight className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
