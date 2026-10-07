import { useLocale, useTranslations } from "next-intl";
import { testimonials } from "@/config/testimonials";
import { Section, SectionHeading } from "./section";

// Hidden until a client gives written consent to publish their quote and name.
export function TestimonialsSection() {
  const t = useTranslations("home.testimonials");
  const locale = useLocale() === "en" ? "en" : "ar";

  if (testimonials.length === 0) return null;

  return (
    <Section id="reviews" labelledBy="reviews-title">
      <SectionHeading id="reviews-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <figure key={item.id} className="rounded-card border border-surface-line bg-surface p-7">
            <blockquote className="text-[17px] leading-[1.75]">{item.quote[locale]}</blockquote>
            <figcaption className="mt-4 text-[15px]">
              <b>{item.name[locale]}</b>
              <span className="block text-text-muted">{item.role[locale]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
