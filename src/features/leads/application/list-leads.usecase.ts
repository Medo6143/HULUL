import type { Lead } from "../domain/lead";
import type { LeadStatus } from "../domain/lead-status";
import type { LeadReader } from "./ports";

export function makeListLeads(deps: { reader: LeadReader }) {
  return async function listLeadsUseCase(filter?: { status?: LeadStatus }): Promise<Lead[]> {
    return deps.reader.list(filter);
  };
}
