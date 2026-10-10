import { describe, expect, it } from "vitest";
import { makeCreateLead } from "@/features/leads/application/create-lead.usecase";
import type { NewLeadInput } from "@/features/leads/domain/lead";
import { InMemoryLeadRepository } from "@/features/leads/infrastructure/in-memory-lead.repository";
import { makeNotificationService } from "@/features/notifications/application/service";
import type { ChatAlerter, EmailMessage, EmailSender, NotificationLog, NotificationLogEntry, SendOutcome } from "@/features/notifications/application/ports";
import type { ContactReceivedEvent, LeadCreatedEvent } from "@/features/notifications/domain/events";
import { escapeHtml, renderContactConfirmation, renderLeadAlert, renderLeadConfirmation } from "@/features/notifications/domain/templates";

const lead: LeadCreatedEvent = {
  kind: "lead.created",
  leadId: "l1",
  type: "project",
  name: "<b>Evil</b> & Co",
  phone: "966512345678",
  email: "client@example.com",
  service: "web",
  description: "Need a site",
  locale: "ar",
  landingPage: "/for/smes",
};
const contact: ContactReceivedEvent = {
  kind: "contact.received",
  messageId: "m1",
  name: "Sara",
  email: "sara@example.com",
  message: "Hello",
  locale: "en",
};

class FakeEmail implements EmailSender {
  sent: EmailMessage[] = [];
  constructor(private readonly outcome: SendOutcome | "throw" = { ok: true }) {}
  async send(message: EmailMessage): Promise<SendOutcome> {
    if (this.outcome === "throw") throw new Error("boom");
    this.sent.push(message);
    return this.outcome;
  }
}
class FakeChat implements ChatAlerter {
  texts: string[] = [];
  async send(text: string): Promise<SendOutcome> {
    this.texts.push(text);
    return { ok: true };
  }
}
class MemoryLog implements NotificationLog {
  entries: NotificationLogEntry[] = [];
  async record(entry: NotificationLogEntry) {
    this.entries.push(entry);
  }
}
const clock = { now: () => new Date("2026-10-10T00:00:00Z") };
const build = (email: EmailSender) => {
  const chat = new FakeChat();
  const log = new MemoryLog();
  return { chat, log, service: makeNotificationService({ email, chat, log, teamEmail: "team@example.com", clock }) };
};

describe("templates", () => {
  it("escapes HTML in user-supplied values", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
    expect(renderLeadAlert(lead).html).not.toContain("<b>Evil</b>");
    expect(renderLeadAlert(lead).html).toContain("&lt;b&gt;Evil&lt;/b&gt;");
  });
  it("writes the confirmation in the visitor's language without promising a reply time", () => {
    const ar = renderLeadConfirmation(lead);
    const en = renderContactConfirmation(contact);
    expect(ar.subject).toContain("حلول تك");
    expect(en.subject).toContain("HULOL TECH");
    for (const text of [ar.text, en.text]) {
      expect(text).not.toMatch(/ساعة|hour|24|3 /i);
    }
  });
  it("uses no emoji", () => {
    const all = [renderLeadAlert(lead), renderLeadConfirmation(lead), renderContactConfirmation(contact)];
    for (const mail of all) expect(mail.text + mail.subject).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe("notification service", () => {
  it("alerts the team and confirms to the customer, logging each attempt", async () => {
    const { service, log, chat } = build(new FakeEmail());
    await service.leadCreated(lead);
    expect(log.entries.map((e) => `${e.channel}:${e.status}`).sort()).toEqual([
      "chat_team:sent",
      "email_customer:sent",
      "email_team:sent",
    ]);
    expect(chat.texts).toHaveLength(1);
  });
  it("skips the customer confirmation when the lead has no email", async () => {
    const { service, log } = build(new FakeEmail());
    await service.leadCreated({ ...lead, email: "" });
    expect(log.entries.some((e) => e.channel === "email_customer")).toBe(false);
  });
  it("records failures and skips without throwing", async () => {
    const failing = build(new FakeEmail("throw"));
    await expect(failing.service.contactReceived(contact)).resolves.toBeUndefined();
    expect(failing.log.entries.filter((e) => e.status === "failed")).toHaveLength(2);

    const unconfigured = build(new FakeEmail({ ok: false, skipped: true }));
    await unconfigured.service.leadCreated(lead);
    expect(unconfigured.log.entries.filter((e) => e.status === "skipped").length).toBeGreaterThan(0);
  });
});

describe("create lead with events", () => {
  const input: NewLeadInput = {
    type: "project",
    segment: "",
    service: "web",
    name: "Test Person",
    phone: "0512345678",
    email: "t@example.com",
    preferredContact: "email",
    businessType: "",
    budgetRange: "",
    timeline: "",
    description: "",
    locale: "ar",
    source: { utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", landingPage: "/", referrer: "" },
    consentGranted: true,
  };
  const deps = (events: { leadCreated: (e: unknown) => Promise<void> }) => ({
    writer: new InMemoryLeadRepository(),
    clock,
    ids: { next: () => "lead-1" },
    policyVersion: "v1",
    events: events as never,
  });

  it("publishes the created lead with the normalized phone", async () => {
    const seen: unknown[] = [];
    const create = makeCreateLead(deps({ leadCreated: async (e) => void seen.push(e) }));
    expect((await create({ input, ipHash: "h" })).ok).toBe(true);
    expect(seen[0]).toMatchObject({ kind: "lead.created", leadId: "lead-1", phone: "966512345678" });
  });
  it("still succeeds when the notification step throws", async () => {
    const create = makeCreateLead(deps({ leadCreated: async () => Promise.reject(new Error("down")) }));
    expect((await create({ input, ipHash: "h" })).ok).toBe(true);
  });
  it("publishes nothing when the lead is rejected", async () => {
    const seen: unknown[] = [];
    const create = makeCreateLead(deps({ leadCreated: async (e) => void seen.push(e) }));
    await create({ input: { ...input, consentGranted: false }, ipHash: "h" });
    expect(seen).toHaveLength(0);
  });
});
