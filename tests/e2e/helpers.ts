import type { Page } from "@playwright/test";

/** Closes the cookie banner with the essential-only choice so it never covers the page under test. */
export async function dismissCookies(page: Page, locale: "ar" | "en" = "ar") {
  const button = page.getByRole("button", { name: locale === "ar" ? "الضرورية فقط" : "Essential only" });
  if (await button.isVisible().catch(() => false)) await button.click();
}
