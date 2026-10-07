import { describe, expect, it } from "vitest";
import { makeSendContactMessage } from "@/features/contact/application/send-contact-message.usecase";
import { createContactMessage, type NewContactMessage } from "@/features/contact/domain/contact-message";
import { InMemoryContactRepository } from "@/features/contact/infrastructure/in-memory-contact.repository";

const base: NewContactMessage = {
  name: "Test Person",
  email: "test@example.com",
  message: "Hello, I have a question.",
  locale: "ar",
  consentGranted: true,
};
const now = new Date("2026-01-01T00:00:00Z");

describe("createContactMessage", () => {
  it("accepts a valid message and trims fields", () => {
    const r = createContactMessage({ ...base, name: "  Test Person  " }, { id: "m1", now });
    expect(r.ok && r.value.name).toBe("Test Person");
  });
  it("rejects bad name, email, message, and missing consent", () => {
    const ctx = { id: "x", now };
    expect(createContactMessage({ ...base, name: "a" }, ctx)).toMatchObject({ ok: false, error: { code: "invalid_name" } });
    expect(createContactMessage({ ...base, email: "nope" }, ctx)).toMatchObject({ ok: false, error: { code: "invalid_email" } });
    expect(createContactMessage({ ...base, message: "hi" }, ctx)).toMatchObject({ ok: false, error: { code: "invalid_message" } });
    expect(createContactMessage({ ...base, message: "x".repeat(2001) }, ctx)).toMatchObject({ ok: false, error: { code: "invalid_message" } });
    expect(createContactMessage({ ...base, consentGranted: false }, ctx)).toMatchObject({ ok: false, error: { code: "consent_required" } });
  });
});

describe("sendContactMessage use-case", () => {
  const clock = { now: () => now };
  const ids = { next: () => "m1" };

  it("stores the message with its consent", async () => {
    const repo = new InMemoryContactRepository();
    const send = makeSendContactMessage({ writer: repo, clock, ids, policyVersion: "v1" });
    const r = await send({ input: base, ipHash: "h" });
    expect(r.ok).toBe(true);
    expect(repo.messages).toHaveLength(1);
    expect(repo.consents[0]).toMatchObject({ policyVersion: "v1", granted: true });
  });
  it("stores nothing when the domain rejects", async () => {
    const repo = new InMemoryContactRepository();
    const send = makeSendContactMessage({ writer: repo, clock, ids, policyVersion: "v1" });
    const r = await send({ input: { ...base, consentGranted: false }, ipHash: "h" });
    expect(r.ok).toBe(false);
    expect(repo.messages).toHaveLength(0);
  });
});
