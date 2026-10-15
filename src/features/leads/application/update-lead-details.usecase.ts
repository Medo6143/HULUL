import { updateLeadDetails, type LeadDetailsPatch } from "../domain/lead";
import type { LeadError } from "../domain/lead.errors";
import { err, ok, type Result } from "../domain/result";
import type { Clock, LeadReader, LeadWriter } from "./ports";

export function makeUpdateLeadDetails(deps: { reader: LeadReader; writer: LeadWriter; clock: Clock }) {
  return async function updateLeadDetailsUseCase(req: { leadId: string; patch: LeadDetailsPatch }): Promise<Result<null, LeadError>> {
    const lead = await deps.reader.findById(req.leadId);
    if (!lead) return err({ code: "not_found" });
    const updated = updateLeadDetails(lead, req.patch, { now: deps.clock.now() });
    if (!updated.ok) return err(updated.error);
    await deps.writer.updateDetails(updated.value);
    return ok(null);
  };
}
