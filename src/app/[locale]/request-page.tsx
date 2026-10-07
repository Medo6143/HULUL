import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SaudiMan, SaudiWoman } from "@/components/illustrations/people";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClassName } from "@/components/ui/button";
import { processSteps } from "@/config/process";
import { LeadForm, type LeadType } from "@/features/leads";
import { whatsappHref } from "@/lib/whatsapp-href";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

/** The only page that hosts the request form (/start). One page-level form, no wizard. */
export async function RequestPage({
  locale,
  type,
}: {
  locale: string;
  type: LeadType;
}) {
  const t = await getTranslations("start");
  const nav = await getTranslations("nav");
  const process = await getTranslations("processPage");
  const side = await getTranslations("requestSide");
  const href = whatsappHref(locale);

  return (
    <main id="main">
      <PageHero eyebrow={nav("consultation")} title={t("title")} intro={t("intro")} />
      <section className="bg-surface-muted py-12 md:py-20">
        <div className="ms-auto me-auto grid max-w-page items-start gap-8 ps-4 pe-4 md:ps-6 md:pe-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative z-10 -mt-24 rounded-panel border border-surface-line bg-surface p-6 shadow-card md:-mt-28 md:p-10">
            <LeadForm type={type} whatsappHref={href} />
          </div>
          <aside className="grid gap-6">
            <div className="rounded-card border border-surface-line bg-surface p-6">
              <h2 className="text-[20px] font-bold">{side("next")}</h2>
              <ol className="mt-4 grid gap-4">
                {processSteps.slice(0, 2).map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-ink-950">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <b className="block">{process(`${step.id}.title`)}</b>
                      <span className="text-[15px] text-text-muted">{process(`${step.id}.text`)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div
              aria-hidden="true"
              className="relative hidden h-48 overflow-hidden rounded-card bg-gradient-to-t from-brand-soft to-surface md:block"
            >
              <SaudiMan className="absolute bottom-0 start-[12%] h-[92%]" />
              <SaudiWoman className="absolute bottom-0 end-[12%] h-[92%]" />
            </div>
            {href ? (
              <div className="rounded-card bg-ink-900 p-6 text-surface">
                <p className="mb-4 font-semibold">{side("whatsapp")}</p>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName("whatsapp", "w-full")}
                >
                  <WhatsAppIcon className="size-5" aria-hidden="true" />
                  {side("whatsappCta")}
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
