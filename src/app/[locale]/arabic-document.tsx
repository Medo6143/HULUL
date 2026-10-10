import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SkipLink } from "@/components/layout/skip-link";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { AnalyticsProvider } from "@/features/analytics";
import type { ProviderIds } from "@/lib/analytics/ids";
import { arabicFont } from "@/fonts/arabic";

export function ArabicDocument({
  locale,
  messages,
  phone,
  analyticsIds,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  phone: string;
  analyticsIds: ProviderIds;
  children: ReactNode;
}) {
  return (
    <html lang={locale} dir="rtl" className={arabicFont.variable}>
      <body className="font-arabic antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <Navbar />
          {children}
          <Footer />
          <WhatsAppFloat phone={phone} />
          <CookieBanner />
          <AnalyticsProvider ids={analyticsIds} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
