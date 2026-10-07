import { describe, expect, it } from "vitest";
import { makeChangeLeadStatus } from "@/features/leads/application/change-lead-status.usecase";
import { makeCreateLead } from "@/features/leads/application/create-lead.usecase";
import type { LeadReader, LeadWriter } from "@/features/leads/application/ports";
import type { NewLeadInput } from "@/features/leads/domain/lead";
import { InMemoryLeadRepository } from "@/features/leads/infrastructure/in-memory-lead.repository";

const input: NewLeadInput = {
  type: "consultation",
  segment: "",
  service: "unsure",
  name: "Test Person",
  phone: "+966512345678",
  email: "t@example.com",
  preferredContact: "email",
  businessType: "",
  budgetRange: "",
  timeline: "",
  description: "",
  locale: "en",
  source: { utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", landingPage: "", referrer: "" },
  consentGranted: true,
};

// Contract suite: any adapter of the lead ports must pass this. Add the Firestore adapter
// here when it runs against the emulator.
function contract(name: string, make: () => LeadReader & LeadWriter) {
  describe(`lead repository contract: ${name}`, () => {
    const clock = { now: () => new Date("2026-01-01T00:00:00Z") };
    let n = 0;
    const ids = { next: () => `lead-${++n}` };

    it("saves a lead with its consent and reads it back", async () => {
      const repo = make();
      const create = makeCreateLead({ writer: repo, clock, ids, policyVersion: "v1" });
      const r = await create({ input, ipHash: "h" });
      expect(r.ok).toBe(true);
      const id = r.ok ? r.value.leadId : "";
      expect((await repo.findById(id))?.status).toBe("new");
      expect(await repo.findById("missing")).toBeNull();
    });

    it("stores nothing when the domain rejects", async () => {
      const repo = make();
      const create = makeCreateLead({ writer: repo, clock, ids, policyVersion: "v1" });
      const r = await create({ input: { ...input, consentGranted: false }, ipHash: "h" });
      expect(r.ok).toBe(false);
      expect(await repo.list()).toHaveLength(0);
    });

    it("changes status, persists it, and rejects forbidden transitions", async () => {
      const repo = make();
      const create = makeCreateLead({ writer: repo, clock, ids, policyVersion: "v1" });
      const change = makeChangeLeadStatus({ reader: repo, writer: repo, clock });
      const created = await create({ input, ipHash: "h" });
      const leadId = created.ok ? created.value.leadId : "";

      expect((await change({ leadId, to: "contacted", by: "a1" })).ok).toBe(true);
      expect((await repo.findById(leadId))?.status).toBe("contacted");
      expect(await change({ leadId, to: "won", by: "a1" })).toMatchObject({ ok: false, error: { code: "transition_not_allowed" } });
      expect(await change({ leadId: "nope", to: "contacted", by: "a1" })).toMatchObject({ ok: false, error: { code: "not_found" } });
      expect(await repo.list({ status: "contacted" })).toHaveLength(1);
      expect(await repo.list({ status: "new" })).toHaveLength(0);
    });
  });
}

contract("in-memory", () => new InMemoryLeadRepository());
