import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { arabicFont } from "@/fonts/arabic";
import "../globals.css";

// The admin is staff-only and Arabic-only. It must never be indexed.
export const metadata: Metadata = {
  title: "حلول تك | لوحة التحكم",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable}>
      <body className="font-arabic antialiased">
        <NextIntlClientProvider locale="ar" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
