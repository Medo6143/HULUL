import type { LeadHistoryReader, LeadNoteStore, LeadReader, LeadWriter } from "../application/ports";
import type { Consent, Lead, StatusHistoryEntry } from "../domain/lead";
import type { LeadNote } from "../domain/note";

export class InMemoryLeadRepository implements LeadReader, LeadWriter, LeadNoteStore, LeadHistoryReader {
  readonly leads = new Map<string, Lead>();
  readonly consents: Consent[] = [];
  readonly historyLog: StatusHistoryEntry[] = [];
  readonly noteLog: LeadNote[] = [];

  async saveNew(lead: Lead, consent: Consent): Promise<void> {
    this.leads.set(lead.id, lead);
    this.consents.push(consent);
  }

  async update(lead: Lead, history: StatusHistoryEntry): Promise<void> {
    if (!this.leads.has(lead.id)) throw new Error(`Lead ${lead.id} does not exist`);
    this.leads.set(lead.id, lead);
    this.historyLog.push(history);
  }

  async updateDetails(lead: Lead): Promise<void> {
    if (!this.leads.has(lead.id)) throw new Error(`Lead ${lead.id} does not exist`);
    this.leads.set(lead.id, lead);
  }

  async delete(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (this.leads.delete(id)) count++;
      for (let i = this.historyLog.length - 1; i >= 0; i--) if (this.historyLog[i]!.leadId === id) this.historyLog.splice(i, 1);
      for (let i = this.noteLog.length - 1; i >= 0; i--) if (this.noteLog[i]!.leadId === id) this.noteLog.splice(i, 1);
    }
    return count;
  }

  async findById(id: string): Promise<Lead | null> {
    return this.leads.get(id) ?? null;
  }

  async list(filter?: { status?: Lead["status"] }): Promise<Lead[]> {
    const all = [...this.leads.values()];
    const filtered = filter?.status ? all.filter((l) => l.status === filter.status) : all;
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async history(leadId: string): Promise<StatusHistoryEntry[]> {
    return this.historyLog
      .filter((entry) => entry.leadId === leadId)
      .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
  }

  async addNote(note: LeadNote): Promise<void> {
    this.noteLog.push(note);
  }

  async listNotes(leadId: string): Promise<LeadNote[]> {
    return this.noteLog
      .filter((note) => note.leadId === leadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
