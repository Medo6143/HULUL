import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEMPLATES,
  makeGetTemplates,
  makeSaveTemplates,
  makeSendInviteEmail,
  normalizeTemplates,
  pickText,
  renderTemplate,
  toInviteEmail,
  whatsappLink,
  type InviteTemplates,
  type TemplateStore,
} from "@/features/templates";

describe("rendering templates", () => {
  it("fills the allowed variables", () => {
    expect(renderTemplate("هلا {{name}} من {{ company }}", { name: "سارة", company: "حلول تك" })).toBe("هلا سارة من حلول تك");
  });
  it("drops a line whose variables are all empty, and keeps lines that still have a value", () => {
    const text = "مرحبا {{name}}\nالموعد: {{date}} الساعة {{time}}\nالرابط: {{meetingLink}}\nشكرا";
    expect(renderTemplate(text, { name: "علي" })).toBe("مرحبا علي\nشكرا");
    expect(renderTemplate(text, { name: "علي", date: "الأحد", meetingLink: "https://meet.example/x" })).toBe(
      "مرحبا علي\nالموعد: الأحد الساعة\nالرابط: https://meet.example/x\nشكرا",
    );
  });
  it("leaves unknown variables visible so typos are noticed, and never evaluates anything", () => {
    expect(renderTemplate("{{nmae}} {{constructor}} ${1+1}", { name: "x" })).toBe("{{nmae}} {{constructor}} ${1+1}");
  });
  it("does not let a value inject another variable", () => {
    expect(renderTemplate("{{name}} {{company}}", { name: "{{company}}", company: "C" })).toBe("{{company}} C");
  });
  it("default templates render cleanly with and without a time, and make no promises", () => {
    const full = renderTemplate(DEFAULT_TEMPLATES.whatsapp.ar, { name: "سارة", service: "موقع", date: "الأحد 12 أكتوبر", time: "10:00", meetingLink: "https://meet.example/x", company: "حلول تك" });
    expect(full).toContain("10:00");
    expect(full).toContain("https://meet.example/x");
    const bare = renderTemplate(DEFAULT_TEMPLATES.whatsapp.ar, { name: "سارة", service: "موقع", company: "حلول تك" });
    expect(bare).not.toContain("{{");
    expect(bare).not.toContain("الموعد المقترح");
    for (const text of [...Object.values(DEFAULT_TEMPLATES.whatsapp), ...Object.values(DEFAULT_TEMPLATES.emailBody), ...Object.values(DEFAULT_TEMPLATES.emailSubject)]) {
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

describe("email and links", () => {
  it("escapes HTML and links only https URLs", () => {
    const mail = toInviteEmail("موضوع", "هلا <script>alert(1)</script>\nرابط: https://meet.example/x?a=1&b=2\nجافاسكربت: javascript:alert(1)");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain('<a href="https://meet.example/x?a=1&amp;b=2">');
    expect(mail.html).not.toContain('href="javascript');
    expect(mail.text).toContain("https://meet.example/x?a=1&b=2");
  });
  it("builds a WhatsApp link only for a valid number, with the message encoded", () => {
    expect(whatsappLink("+966 50 123 4567", "هلا & مرحبا")).toBe(`https://wa.me/966501234567?text=${encodeURIComponent("هلا & مرحبا")}`);
    expect(whatsappLink("123", "x")).toBeNull();
  });
  it("picks English only when it exists", () => {
    expect(pickText({ ar: "عربي", en: "" }, "en")).toBe("عربي");
    expect(pickText({ ar: "عربي", en: "English" }, "en")).toBe("English");
    expect(pickText({ ar: "عربي", en: "English" }, "ar")).toBe("عربي");
  });
});

describe("saving templates", () => {
  const memory = (): TemplateStore & { saved: InviteTemplates | null } => {
    const store = {
      saved: null as InviteTemplates | null,
      async get() {
        return store.saved;
      },
      async save(t: InviteTemplates) {
        store.saved = t;
      },
    };
    return store;
  };
  it("serves the defaults until something is saved", async () => {
    const store = memory();
    expect(await makeGetTemplates({ store })()).toMatchObject({ isDefault: true });
    await makeSaveTemplates({ store })({ templates: DEFAULT_TEMPLATES, updatedBy: "o" });
    expect(await makeGetTemplates({ store })()).toMatchObject({ isDefault: false });
  });
  it("requires Arabic text and caps lengths", () => {
    expect(normalizeTemplates({ ...DEFAULT_TEMPLATES, whatsapp: { ar: "  ", en: "x" } }).ok).toBe(false);
    expect(normalizeTemplates({ ...DEFAULT_TEMPLATES, emailSubject: { ar: "ع".repeat(151), en: "" } }).ok).toBe(false);
    expect(normalizeTemplates({ ...DEFAULT_TEMPLATES, emailBody: { ar: "نص", en: "" } }).ok).toBe(true);
  });
});

describe("sending an invitation email", () => {
  const send = (lead: { email: string; name: string } | null, ok = true) => {
    const sent: { to: string }[] = [];
    const use = makeSendInviteEmail({
      leads: { find: async () => lead },
      mailer: { send: async (m) => (ok ? (sent.push({ to: m.to }), true) : false) },
    });
    return { use, sent };
  };
  it("sends to the lead's own address, chosen on the server", async () => {
    const { use, sent } = send({ email: "lead@example.com", name: "x" });
    expect((await use({ leadId: "l1", subject: "موضوع", body: "نص" })).ok).toBe(true);
    expect(sent).toEqual([{ to: "lead@example.com" }]);
  });
  it("reports missing lead, missing email, bad input, and send failures", async () => {
    expect(await send(null).use({ leadId: "l", subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await send({ email: "", name: "x" }).use({ leadId: "l", subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "no_email" } });
    expect(await send({ email: "a@b.co", name: "x" }).use({ leadId: "l", subject: " ", body: "b" })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await send({ email: "a@b.co", name: "x" }, false).use({ leadId: "l", subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "send_failed" } });
  });
});
