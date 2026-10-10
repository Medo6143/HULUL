import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClassName } from "@/components/ui/button";
import { FinalCta } from "@/components/sections/final-cta";
import { Section } from "@/components/sections/section";
import { loadCaseStudy } from "@/app/_lib/public-content";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/page-metadata";
import { whatsappHref } from "@/lib/whatsapp-href";

// Case studies come from the admin, so pages are rendered on demand and cached; there is nothing to prebuild.
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const study = await loadCaseStudy(slug);
  if (!study) return {};
  const key = locale === "en" ? "en" : "ar";
  return pageMetadata({ locale, path: `/work/${slug}`, title: study.title[key], description: study.result[key] });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const study = await loadCaseStudy(slug);
  if (!study) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("work");
  const key = locale === "en" ? "en" : "ar";

  const blocks = [
    { id: "problem", title: t("problem"), text: study.problem[key] },
    { id: "solution", title: t("solution"), text: study.solution[key] },
    { id: "result", title: t("result"), text: study.result[key] },
  ];

  return (
    <main id="main" data-track-view="case_study_view" data-slug={slug}>
      <PageHero
        eyebrow={t("title")}
        title={study.title[key]}
        actions={
          <Link href="/work" className={buttonClassName("ghost", "min-h-12")}>
            <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            {t("allWork")}
          </Link>
        }
      />
      <Section tone="muted">
        <div className="ms-auto me-auto grid max-w-3xl gap-6">
          {study.images.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {study.images.map((image, index) => (
                <div
                  key={image.url}
                  className={`relative aspect-[16/10] overflow-hidden rounded-card bg-surface-muted ${index === 0 ? "md:col-span-2" : ""}`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt[key] || study.title[key]}
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {blocks.map((block) => (
            <section key={block.id} className="rounded-card border border-surface-line bg-surface p-8">
              <h2 className="text-[22px] font-bold">{block.title}</h2>
              <p className="mt-3 whitespace-pre-line text-[17px] leading-[1.9] text-text-muted">{block.text}</p>
            </section>
          ))}
        </div>
      </Section>
      <FinalCta whatsappHref={whatsappHref(locale)} />
    </main>
  );
}
