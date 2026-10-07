import { Gift, MapPin, Layers, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";

// Only confirmed facts are shown. Project count and response time stay out until management supplies them.
export function TrustBar() {
  const t = useTranslations("home.trust");
  const items: { value: string; label: string; Icon: LucideIcon; ltr?: boolean }[] = [];

  if (siteConfig.crNumber) {
    items.push({ value: `CR ${siteConfig.crNumber}`, label: t("cr"), Icon: ShieldCheck, ltr: true });
  }
  items.push(
    { value: t("location"), label: t("locationHint"), Icon: MapPin },
    { value: t("scope"), label: t("scopeHint"), Icon: Layers },
    { value: t("free"), label: t("freeHint"), Icon: Gift },
  );

  return (
    <div className="relative z-10 -mt-8 ps-4 pe-4 md:ps-6 md:pe-6">
      <ul className="ms-auto me-auto grid max-w-page grid-cols-1 gap-px overflow-hidden rounded-card border border-surface-line bg-surface-line shadow-card sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {items.map(({ value, label, Icon, ltr }) => (
          <li key={label} className="flex items-center gap-4 bg-surface p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-ink-900">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <span>
              <b className="block text-[18px] leading-[1.4] text-ink-900" dir={ltr ? "ltr" : undefined}>
                {value}
              </b>
              <span className="text-[15px] text-text-muted">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
