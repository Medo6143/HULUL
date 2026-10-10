import { expect, test } from "@playwright/test";
import { dismissCookies } from "./helpers";

test.describe("project request", () => {
  test("a visitor goes from the home page to a sent request (Arabic)", async ({ page }) => {
    let sent: Record<string, unknown> | null = null;
    await page.route("**/api/leads", async (route) => {
      sent = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 201, json: { ok: true } });
    });

    await page.goto("/ar");
    await dismissCookies(page);
    await page.getByRole("link", { name: "احجز استشارتك المجانية" }).first().click();
    await expect(page).toHaveURL(/\/ar\/start$/);

    await page.getByText("موقع إلكتروني", { exact: true }).click();
    await page.getByLabel("الاسم", { exact: true }).fill("Test Person");
    await page.getByLabel("رقم الجوال").fill("0512345678");
    await page.getByRole("checkbox", { name: /أوافق على معالجة بياناتي/ }).check();
    await page.getByRole("button", { name: "أرسل الطلب" }).click();

    await expect(page.getByRole("heading", { name: "وصلنا طلبك" })).toBeVisible();
    expect(sent).toMatchObject({ type: "project", service: "web", phone: "0512345678", consent: true, locale: "ar" });
  });

  test("the form blocks an empty submit and sends nothing", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/leads", async (route) => {
      requests += 1;
      await route.fulfill({ status: 201, json: { ok: true } });
    });
    await page.goto("/ar/start");
    await dismissCookies(page);
    await page.getByRole("button", { name: "أرسل الطلب" }).click();

    await expect(page.getByText("هذا الحقل مطلوب").first()).toBeVisible();
    await expect(page.getByText("نحتاج موافقتك لإرسال الطلب")).toBeVisible();
    expect(requests).toBe(0);
  });

  test("consent starts unchecked and a server error keeps the visitor's answers", async ({ page }) => {
    await page.route("**/api/leads", (route) => route.fulfill({ status: 429, json: { ok: false, error: { code: "rate_limited" } } }));
    await page.goto("/ar/start");
    await dismissCookies(page);

    const consent = page.getByRole("checkbox", { name: /أوافق على معالجة بياناتي/ });
    await expect(consent).not.toBeChecked();

    await page.getByText("تطبيق جوال", { exact: true }).click();
    await page.getByLabel("الاسم", { exact: true }).fill("Test Person");
    await page.getByLabel("رقم الجوال").fill("0512345678");
    await consent.check();
    await page.getByRole("button", { name: "أرسل الطلب" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "أرسلت طلبات كثيرة" })).toBeVisible();
    await expect(page.getByLabel("الاسم", { exact: true })).toHaveValue("Test Person");
  });

  test("the English form works the same way", async ({ page }) => {
    let sent: Record<string, unknown> | null = null;
    await page.route("**/api/leads", async (route) => {
      sent = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 201, json: { ok: true } });
    });
    await page.goto("/en/start");
    await dismissCookies(page, "en");

    await page.getByText("Website", { exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Test Person");
    await page.getByLabel("Mobile number").fill("0512345678");
    await page.getByRole("checkbox", { name: /I agree to the processing of my data/ }).check();
    await page.getByRole("button", { name: "Send request" }).click();

    await expect(page.getByRole("heading", { name: "We received your request" })).toBeVisible();
    expect(sent).toMatchObject({ locale: "en", service: "web" });
  });

  test("/consultation lands on the single request page", async ({ page }) => {
    await page.goto("/ar/consultation");
    await expect(page).toHaveURL(/\/ar\/start$/);
  });
});

test.describe("email contact form", () => {
  test("sends a message from the home page", async ({ page }) => {
    let sent: Record<string, unknown> | null = null;
    await page.route("**/api/contact", async (route) => {
      sent = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 201, json: { ok: true } });
    });
    await page.goto("/ar");
    await dismissCookies(page);

    const form = page.locator("#contact form");
    await form.getByLabel("الاسم").fill("Sara");
    await form.getByLabel("البريد الإلكتروني").fill("sara@example.com");
    await form.getByLabel("رسالتك").fill("I have a question about a mobile app.");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "أرسل الرسالة" }).click();

    await expect(page.getByRole("heading", { name: "وصلتنا رسالتك" })).toBeVisible();
    expect(sent).toMatchObject({ email: "sara@example.com", consent: true, locale: "ar" });
  });
});
