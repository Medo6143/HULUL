import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DesignPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("preview");

  return (
    <PageShell title={t("title")}>
      <p>{t("intro")}</p>
      <div className="flex flex-wrap gap-3">
        <Button>{t("primary")}</Button>
        <Button variant="secondary">{t("secondary")}</Button>
        <Button variant="whatsapp">{t("whatsapp")}</Button>
        <Button disabled>{t("disabled")}</Button>
        <Button loading>{t("loading")}</Button>
      </div>
      <div className="rounded-card bg-ink-900 p-6">
        <Button variant="ghost">{t("ghost")}</Button>
      </div>
      <Input label={t("name")} name="name" autoComplete="name" />
      <Input label={t("name")} name="name-error" error={t("nameError")} defaultValue="" />
      <Input label={t("phone")} name="phone" ltr inputMode="tel" autoComplete="tel" placeholder="5XXXXXXXX" />
      <Input label={t("disabledField")} name="disabled" disabled defaultValue="--" />
      <div className="flex flex-wrap gap-2">
        <Badge>{t("badgeNeutral")}</Badge>
        <Badge tone="success">{t("badgeSuccess")}</Badge>
        <Badge tone="warning">{t("badgeWarning")}</Badge>
        <Badge tone="danger">{t("badgeDanger")}</Badge>
      </div>
    </PageShell>
  );
}
