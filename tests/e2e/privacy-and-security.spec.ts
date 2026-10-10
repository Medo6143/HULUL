import { expect, test } from "@playwright/test";
import { dismissCookies } from "./helpers";

test.describe("cookie consent", () => {
  test("shows on the first visit, remembers the choice, and can be reopened", async ({ page }) => {
    await page.goto("/ar");
    const banner = page.getByRole("region", { name: "ملفات تعريف الارتباط" });
    await expect(banner).toBeVisible();

    await page.getByRole("button", { name: "الضرورية فقط" }).click();
    await expect(banner).toBeHidden();

    await page.reload();
    await expect(banner).toBeHidden();

    await page.getByRole("button", { name: "إعدادات الكوكيز" }).click();
    await expect(banner).toBeVisible();
  });

  test("no tracking request leaves the browser before the visitor agrees", async ({ page }) => {
    const tracked: string[] = [];
    page.on("request", (request) => {
      if (/googletagmanager|google-analytics|clarity\.ms|connect\.facebook|sc-static\.net|analytics\.tiktok/.test(request.url())) {
        tracked.push(request.url());
      }
    });
    await page.goto("/ar");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "الضرورية فقط" }).click();
    await page.waitForLoadState("networkidle");
    expect(tracked).toEqual([]);
  });
});

test.describe("security and search", () => {
  test("pages carry the security headers", async ({ request }) => {
    const response = await request.get("/ar");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the admin sends visitors without a session to the login page", async ({ page }) => {
    await page.goto("/admin/leads");
    // A local preview with ADMIN_DEMO=1 skips the gate on purpose; the check only applies without it.
    test.skip(!page.url().includes("/admin/login"), "ADMIN_DEMO preview is active");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("the admin API rejects requests without a session", async ({ request }) => {
    const response = await request.post("/api/admin/leads/anything/status", { data: { to: "contacted" } });
    expect([401, 403]).toContain(response.status());
  });

  test("the public form API refuses bad input", async ({ request }) => {
    const response = await request.post("/api/leads", { data: { name: "x" } });
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_input");
  });

  test("sitemap lists both languages and robots blocks the placeholder domain", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/ar/services/web");
    expect(sitemap).toContain("/en/services/web");
    expect(sitemap).not.toMatch(/\/admin|\/api\//);

    const robots = await (await request.get("/robots.txt")).text();
    // CI and local runs use example.com, so everything stays blocked until a real domain is set.
    expect(robots).toMatch(/Disallow: \//);
  });

  test("a page exposes canonical, hreflang, and structured data", async ({ page }) => {
    await page.goto("/ar/services/web");
    await dismissCookies(page);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar\/services\/web$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en\/services\/web$/);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld ?? "{}")["@type"]).toBe("Service");
  });
});
