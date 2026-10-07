import { describe, expect, it } from "vitest";
import { changeStatus, createLead, normalizePhone, type NewLeadInput } from "@/features/leads/domain/lead";
import { LEAD_STATUSES, canTransition } from "@/features/leads/domain/lead-status";

const base: NewLeadInput = {
  type: "project",
  segment: "smes",
  service: "web",
  name: "Test Person",
  phone: "0512345678",
  email: "",
  preferredContact: "whatsapp",
  businessType: "",
  budgetRange: "",
  timeline: "",
  description: "",
  locale: "ar",
  source: { utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", landingPage: "", referrer: "" },
  consentGranted: true,
};
const now = new Date("2026-01-01T00:00:00Z");

describe("normalizePhone", () => {
  it("converts Saudi local, +, and 00 prefixes", () => {
    expect(normalizePhone("0512345678")).toBe("966512345678");
    expect(normalizePhone("+966 51 234 5678")).toBe("966512345678");
    expect(normalizePhone("00966512345678")).toBe("966512345678");
  });
});

describe("createLead", () => {
  it("creates a new lead with status new", () => {
    const r = createLead(base, { id: "l1", now });
    expect(r.ok && r.value.status).toBe("new");
    expect(r.ok && r.value.phone).toBe("966512345678");
  });
  it("rejects missing consent", () => {
    const r = createLead({ ...base, consentGranted: false }, { id: "l1", now });
    expect(r).toEqual({ ok: false, error: { code: "consent_required" } });
  });
  it("rejects invalid phone, name and email", () => {
    expect(createLead({ ...base, phone: "123" }, { id: "x", now })).toMatchObject({ ok: false, error: { code: "invalid_phone" } });
    expect(createLead({ ...base, name: " a " }, { id: "x", now })).toMatchObject({ ok: false, error: { code: "invalid_name" } });
    expect(createLead({ ...base, email: "nope" }, { id: "x", now })).toMatchObject({ ok: false, error: { code: "invalid_email" } });
  });
});

describe("changeStatus", () => {
  const lead = (() => {
    const r = createLead(base, { id: "l1", now });
    if (!r.ok) throw new Error("setup");
    return r.value;
  })();

  it("allows new -> contacted and records history", () => {
    const r = changeStatus(lead, "contacted", { by: "admin1", now });
    expect(r.ok && r.value.lead.status).toBe("contacted");
    expect(r.ok && r.value.history).toMatchObject({ from: "new", to: "contacted", changedBy: "admin1" });
  });
  it("requires a reason to lose a lead", () => {
    expect(changeStatus(lead, "lost", { by: "a", now })).toMatchObject({ ok: false, error: { code: "reason_required" } });
    const r = changeStatus(lead, "lost", { by: "a", now, reason: "budget" });
    expect(r.ok && r.value.lead.lostReason).toBe("budget");
  });
  it("rejects every transition not in the table, and nothing leaves won", () => {
    expect(changeStatus(lead, "won", { by: "a", now })).toMatchObject({ ok: false, error: { code: "transition_not_allowed" } });
    for (const to of LEAD_STATUSES) expect(canTransition("won", to)).toBe(false);
  });
});
