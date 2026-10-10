import { useLocale, useTranslations } from "next-intl";
import { Section, SectionHeading } from "./section";

export interface TestimonialItem {
  id: string;
  quote: { ar: string; en: string };
  name: { ar: string; en: string };
  role: { ar: string; en: string };
}

// Hidden until a client gives written consent to publish their quote and name (the admin enforces it).
export function TestimonialsSection({ items }: { items: readonly TestimonialItem[] }) {
  const t = useTranslations("home.testimonials");
  const locale = useLocale() === "en" ? "en" : "ar";

  if (items.length === 0) return null;

  return (
    <Section id="reviews" labelledBy="reviews-title">
      <SectionHeading id="reviews-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="rounded-card border border-surface-line bg-surface p-7">
            <blockquote className="text-[17px] leading-[1.75]">{item.quote[locale]}</blockquote>
            <figcaption className="mt-4 text-[15px]">
              <b>{item.name[locale]}</b>
              {item.role[locale] ? <span className="block text-text-muted">{item.role[locale]}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
