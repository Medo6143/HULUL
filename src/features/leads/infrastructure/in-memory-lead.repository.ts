import type { LeadReader, LeadWriter } from "../application/ports";
import type { Consent, Lead, StatusHistoryEntry } from "../domain/lead";

export class InMemoryLeadRepository implements LeadReader, LeadWriter {
  readonly leads = new Map<string, Lead>();
  readonly consents: Consent[] = [];
  readonly history: StatusHistoryEntry[] = [];

  async saveNew(lead: Lead, consent: Consent): Promise<void> {
    this.leads.set(lead.id, lead);
    this.consents.push(consent);
  }

  async update(lead: Lead, history: StatusHistoryEntry): Promise<void> {
    if (!this.leads.has(lead.id)) throw new Error(`Lead ${lead.id} does not exist`);
    this.leads.set(lead.id, lead);
    this.history.push(history);
  }

  async findById(id: string): Promise<Lead | null> {
    return this.leads.get(id) ?? null;
  }

  async list(filter?: { status?: Lead["status"] }): Promise<Lead[]> {
    const all = [...this.leads.values()];
    const filtered = filter?.status ? all.filter((l) => l.status === filter.status) : all;
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
