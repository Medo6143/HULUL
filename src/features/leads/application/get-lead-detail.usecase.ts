import type { Lead, StatusHistoryEntry } from "../domain/lead";
import type { LeadError } from "../domain/lead.errors";
import type { LeadNote } from "../domain/note";
import { err, ok, type Result } from "../domain/result";
import type { LeadHistoryReader, LeadNoteStore, LeadReader } from "./ports";

export interface LeadDetail {
  lead: Lead;
  history: StatusHistoryEntry[];
  notes: LeadNote[];
}

export function makeGetLeadDetail(deps: { reader: LeadReader; history: LeadHistoryReader; notes: LeadNoteStore }) {
  return async function getLeadDetailUseCase(leadId: string): Promise<Result<LeadDetail, LeadError>> {
    const lead = await deps.reader.findById(leadId);
    if (!lead) return err({ code: "not_found" });
    const [history, notes] = await Promise.all([deps.history.history(leadId), deps.notes.listNotes(leadId)]);
    return ok({ lead, history, notes });
  };
}
