import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/page-shell";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <PageShell title={t("title")}>
      <p>{t("body")}</p>
      <p>
        <Link href="/" className="font-semibold text-ink-950 underline">
          {t("home")}
        </Link>
      </p>
    </PageShell>
  );
}
