import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SkipLink } from "@/components/layout/skip-link";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { latinFont } from "@/fonts/latin";

export function LatinDocument({
  locale,
  messages,
  phone,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  phone: string;
  children: ReactNode;
}) {
  return (
    <html lang={locale} dir="ltr" className={latinFont.variable}>
      <body className="font-latin antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <Navbar />
          {children}
          <Footer />
          <WhatsAppFloat phone={phone} />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
