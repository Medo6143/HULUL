import { redirect } from "@/i18n/navigation";

// The request form lives on one page only: /start.
export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/start", locale });
}
