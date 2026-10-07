import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("root redirects to Arabic and sets RTL", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("نبني لك");
});

test("English sets LTR", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("We build your website");
});

test("component preview has no serious accessibility violations", async ({ page }) => {
  await page.goto("/ar/design-preview");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});
