import { describe, expect, it } from "vitest";
import { makeAddLeadNote } from "@/features/leads/application/add-lead-note.usecase";
import { makeChangeLeadStatus } from "@/features/leads/application/change-lead-status.usecase";
import { makeCreateLead } from "@/features/leads/application/create-lead.usecase";
import { makeDeleteLeads } from "@/features/leads/application/delete-leads.usecase";
import { makeUpdateLeadDetails } from "@/features/leads/application/update-lead-details.usecase";
import type { LeadDetailsPatch, NewLeadInput } from "@/features/leads/domain/lead";
import { InMemoryLeadRepository } from "@/features/leads/infrastructure/in-memory-lead.repository";

const base: NewLeadInput = {
  type: "project", segment: "", service: "web", name: "Sara Ali", phone: "0512345678", email: "", preferredContact: "whatsapp",
  businessType: "", budgetRange: "", timeline: "", description: "", locale: "ar",
  source: { utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", landingPage: "", referrer: "" }, consentGranted: true,
};
const patch = (over: Partial<LeadDetailsPatch> = {}): LeadDetailsPatch => ({
  name: "Sara Ali", phone: "0512345678", email: "", service: "web", preferredContact: "whatsapp", businessType: "", timeline: "", description: "", ...over,
});

async function world() {
  const repo = new InMemoryLeadRepository();
  const clock = { now: () => new Date("2026-10-10T08:00:00Z") };
  let n = 0;
  const ids = { next: () => `l${++n}` };
  const create = makeCreateLead({ writer: repo, clock, ids, policyVersion: "v1" });
  const a = await create({ input: base, ipHash: "h" });
  const b = await create({ input: { ...base, name: "Omar Said" }, ipHash: "h" });
  return { repo, clock, ids, a: a.ok ? a.value.leadId : "", b: b.ok ? b.value.leadId : "" };
}

describe("editing lead details", () => {
  it("corrects the details, normalizes the phone, and keeps status and source", async () => {
    const { repo, clock, a } = await world();
    const update = makeUpdateLeadDetails({ reader: repo, writer: repo, clock });
    const r = await update({ leadId: a, patch: patch({ name: "  Sara Ahmed ", phone: "+966 50 111 2222", email: "s@x.com", service: "mobile", description: " new text " }) });
    expect(r.ok).toBe(true);
    const lead = await repo.findById(a);
    expect(lead).toMatchObject({ name: "Sara Ahmed", phone: "966501112222", email: "s@x.com", service: "mobile", description: "new text", status: "new" });
  });
  it("rejects a bad name, phone, or email and a missing lead, without saving", async () => {
    const { repo, clock, a } = await world();
    const update = makeUpdateLeadDetails({ reader: repo, writer: repo, clock });
    expect(await update({ leadId: a, patch: patch({ name: "A" }) })).toMatchObject({ ok: false, error: { code: "invalid_name" } });
    expect(await update({ leadId: a, patch: patch({ phone: "123" }) })).toMatchObject({ ok: false, error: { code: "invalid_phone" } });
    expect(await update({ leadId: a, patch: patch({ email: "nope" }) })).toMatchObject({ ok: false, error: { code: "invalid_email" } });
    expect(await update({ leadId: "zzz", patch: patch() })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect((await repo.findById(a))?.name).toBe("Sara Ali");
  });
});

describe("deleting leads", () => {
  it("deletes the lead with its notes and history, and leaves the others", async () => {
    const { repo, clock, ids, a, b } = await world();
    await makeAddLeadNote({ reader: repo, notes: repo, clock, ids })({ leadId: a, text: "note", authorUid: "u", authorName: "n" });
    await makeChangeLeadStatus({ reader: repo, writer: repo, clock })({ leadId: a, to: "contacted", by: "u" });
    const remove = makeDeleteLeads({ writer: repo });
    expect(await remove({ ids: [a] })).toMatchObject({ ok: true, value: { deleted: 1 } });
    expect(await repo.findById(a)).toBeNull();
    expect(await repo.listNotes(a)).toEqual([]);
    expect(await repo.history(a)).toEqual([]);
    expect(await repo.findById(b)).not.toBeNull();
  });
  it("handles several ids, ignores unknown or duplicate ones, and refuses empty or oversized batches", async () => {
    const { repo, a, b } = await world();
    const remove = makeDeleteLeads({ writer: repo });
    expect(await remove({ ids: [a, a, b, "ghost", " "] })).toMatchObject({ ok: true, value: { deleted: 2 } });
    expect(await remove({ ids: [] })).toMatchObject({ ok: false });
    expect(await remove({ ids: Array.from({ length: 101 }, (_, i) => `id${i}`) })).toMatchObject({ ok: false });
  });
});
