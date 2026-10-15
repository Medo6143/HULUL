import { Quote, Star } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { Section, SectionHeading } from "./section";

export interface TestimonialItem {
  id: string;
  quote: { ar: string; en: string };
  name: { ar: string; en: string };
  role: { ar: string; en: string };
  rating?: number;
  photoUrl?: string;
  project?: { slug: string; title: { ar: string; en: string } };
  /** Only the admin preview sets this, to mark design samples. */
  sample?: boolean;
}

/** Cloudinary face-aware square crop for the small round photo. */
const avatarSrc = (url: string) => url.replace("/upload/", "/upload/c_fill,g_face,w_160,h_160,f_auto,q_auto/");

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={cn("size-[18px]", n <= value ? "fill-warning text-warning" : "text-surface-line")} />
      ))}
    </span>
  );
}

// Hidden until a client gives written consent to publish their quote and name (the admin enforces it).
export function TestimonialsSection({ items, preview = false }: { items: readonly TestimonialItem[]; preview?: boolean }) {
  const t = useTranslations("home.testimonials");
  const locale = useLocale() === "en" ? "en" : "ar";

  if (items.length === 0) return null;

  const rated = items.filter((item) => (item.rating ?? 0) > 0);
  const average = rated.length > 0 ? rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length : 0;

  return (
    <Section id="reviews" tone="muted" labelledBy="reviews-title">
      <SectionHeading id="reviews-title" eyebrow={t("eyebrow")} title={t("title")} />
      {rated.length > 0 ? (
        <div className="mb-10 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-surface-line bg-surface ps-6 pe-6 py-3 shadow-card">
            <b className="text-[28px] leading-none tabular-nums">{average.toFixed(1)}</b>
            <Stars value={Math.round(average)} label={t("average", { value: average.toFixed(1) })} />
            <span className="text-[15px] text-text-muted">{t("count", { count: rated.length })}</span>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, index) => {
          const name = item.name[locale] || item.name.ar;
          return (
            <Reveal key={item.id} delay={index * 120} className="h-full">
              <figure className="relative flex h-full flex-col overflow-hidden rounded-card border border-surface-line bg-surface p-7 shadow-card motion-safe:transition hover:-translate-y-1 hover:shadow-lg">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-strong to-ink-900" />
                {item.sample ? (
                  <span className="absolute end-4 top-4 rounded-full bg-warning/15 ps-3 pe-3 py-0.5 text-[12px] font-bold text-warning">{t("sample")}</span>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-ink-900">
                    <Quote className="size-6" aria-hidden="true" />
                  </span>
                  {item.rating ? <Stars value={item.rating} label={t("rating", { value: item.rating })} /> : null}
                </div>
                <blockquote className="mt-5 flex-1 text-[17px] leading-[1.85] text-text">{item.quote[locale] || item.quote.ar}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-surface-line pt-5">
                  {item.photoUrl ? (
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-brand/40">
                      <Image src={avatarSrc(item.photoUrl)} alt={name} fill sizes="56px" className="object-cover" />
                    </span>
                  ) : (
                    <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-[20px] font-bold text-ink-950">
                      {name.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0 text-[15px]">
                    <b className="block truncate text-[16px]">{name}</b>
                    {(item.role[locale] || item.role.ar) ? <span className="block truncate text-text-muted">{item.role[locale] || item.role.ar}</span> : null}
                    {item.project ? (
                      preview ? (
                        <span className="mt-1 inline-block text-[13px] font-semibold text-brand-strong">
                          {t("project", { name: item.project.title[locale] || item.project.title.ar })}
                        </span>
                      ) : (
                        <Link href={`/work/${item.project.slug}`} className="mt-1 inline-block text-[13px] font-semibold text-brand-strong underline-offset-4 hover:underline">
                          {t("project", { name: item.project.title[locale] || item.project.title.ar })}
                        </Link>
                      )
                    ) : null}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
