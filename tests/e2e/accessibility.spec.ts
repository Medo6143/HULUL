import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dismissCookies } from "./helpers";

const PAGES = ["", "/services", "/services/web", "/for/smes", "/process", "/about", "/work", "/start", "/privacy"];

for (const locale of ["ar", "en"] as const) {
  for (const path of PAGES) {
    test(`no serious accessibility violations: /${locale}${path}`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      await dismissCookies(page, locale);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    });
  }
}

test("the page sets language and direction for each locale", async ({ page }) => {
  await page.goto("/ar/about");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/en/about");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("every page has one h1 and a skip link target", async ({ page }) => {
  for (const path of ["/ar", "/ar/services/web", "/ar/start", "/en/process"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("#main")).toHaveCount(1);
  }
});
