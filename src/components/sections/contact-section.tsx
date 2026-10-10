import { ArrowRight, Mail, MapPin, Phone, PenLine, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { Section, SectionHeading } from "./section";

/** "+966 58 189 7297" for Saudi numbers, "+<digits>" otherwise. */
function formatDisplay(digits: string): string {
  if (/^966\d{9}$/.test(digits)) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}

interface Channel {
  key: string;
  title: string;
  value: string;
  hint: string;
  href?: string;
  external?: boolean;
  ltr?: boolean;
  Icon: LucideIcon | typeof WhatsAppIcon;
  accent?: boolean;
}

/** Only confirmed channels are listed. Email and phone appear once they are set in siteConfig. */
export function ContactSection({
  whatsappHref,
  whatsappNumber,
  form,
}: {
  whatsappHref: string | null;
  whatsappNumber: string;
  /** Email contact form, passed in as a slot so this section stays free of feature imports. */
  form: ReactNode;
}) {
  const t = useTranslations("home.contact");
  const channels: Channel[] = [];

  if (whatsappHref && whatsappNumber) {
    channels.push({
      key: "whatsapp",
      title: t("whatsapp"),
      value: formatDisplay(whatsappNumber.replace(/\D/g, "")),
      hint: t("whatsappHint"),
      href: whatsappHref,
      external: true,
      ltr: true,
      Icon: WhatsAppIcon,
      accent: true,
    });
  }
  if (siteConfig.phoneDisplay) {
    channels.push({
      key: "phone",
      title: t("phone"),
      value: siteConfig.phoneDisplay,
      hint: t("phoneHint"),
      href: `tel:${siteConfig.phoneDisplay.replace(/[^\d+]/g, "")}`,
      ltr: true,
      Icon: Phone,
    });
  }
  if (siteConfig.email) {
    channels.push({
      key: "email",
      title: t("email"),
      value: siteConfig.email,
      hint: t("emailHint"),
      href: `mailto:${siteConfig.email}`,
      ltr: true,
      Icon: Mail,
    });
  }
  channels.push({
    key: "form",
    title: t("form"),
    value: t("formValue"),
    hint: t("formHint"),
    Icon: PenLine,
  });
  channels.push({
    key: "location",
    title: t("location"),
    value: t("locationValue"),
    hint: t("locationHint"),
    Icon: MapPin,
  });

  return (
    <div data-track-location="contact">
<Section id="contact" tone="muted" labelledBy="contact-title">
      <SectionHeading
        id="contact-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        intro={t("intro")}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <ul className="grid gap-4">
          {channels.map(({ key, title, value, hint, href, external, ltr, Icon, accent }) => {
            const body = (
              <>
                <span
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-2xl",
                    accent
                      ? "bg-whatsapp text-ink-950"
                      : "bg-gradient-to-br from-brand to-brand-strong text-ink-950",
                  )}
                >
                  <Icon className="size-7" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] text-text-muted">{title}</span>
                  <b
                    className="block truncate text-[18px] leading-[1.5] text-ink-900"
                    dir={ltr ? "ltr" : undefined}
                  >
                    {value}
                  </b>
                  <span className="block text-[15px] text-text-muted">{hint}</span>
                </span>
              </>
            );
            const cardClass =
              "flex items-center gap-4 rounded-card border border-surface-line bg-surface p-5 motion-safe:transition";
            if (key === "form") {
              return (
                <li key={key}>
                  <Link href="/start" className={cn(cardClass, "h-full hover:-translate-y-1 hover:shadow-card")}>
                    {body}
                    <ArrowRight className="ms-auto size-5 shrink-0 text-ink-900 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </li>
              );
            }
            if (href) {
              return (
                <li key={key}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cn(cardClass, "h-full hover:-translate-y-1 hover:shadow-card")}
                  >
                    {body}
                  </a>
                </li>
              );
            }
            return (
              <li key={key} className={cn(cardClass, "h-full")}>
                {body}
              </li>
            );
          })}
        </ul>
        <div className="rounded-panel border border-surface-line bg-surface p-6 shadow-card md:p-9">{form}</div>
      </div>
    </Section>
    </div>
  );
}
