import { changeStatus } from "../domain/lead";
import type { LeadStatus } from "../domain/lead-status";
import type { LeadError } from "../domain/lead.errors";
import { err, ok, type Result } from "../domain/result";
import type { Clock, LeadReader, LeadWriter } from "./ports";

export function makeChangeLeadStatus(deps: { reader: LeadReader; writer: LeadWriter; clock: Clock }) {
  return async function changeLeadStatusUseCase(req: {
    leadId: string;
    to: LeadStatus;
    by: string;
    reason?: string;
  }): Promise<Result<null, LeadError>> {
    const lead = await deps.reader.findById(req.leadId);
    if (!lead) return err({ code: "not_found" });

    const changed = changeStatus(lead, req.to, {
      by: req.by,
      now: deps.clock.now(),
      reason: req.reason,
    });
    if (!changed.ok) return err(changed.error);

    await deps.writer.update(changed.value.lead, changed.value.history);
    return ok(null);
  };
}
