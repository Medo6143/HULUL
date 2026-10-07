import { createLead, type NewLeadInput } from "../domain/lead";
import type { LeadError } from "../domain/lead.errors";
import { err, ok, type Result } from "../domain/result";
import type { Clock, IdGenerator, LeadWriter } from "./ports";

export interface CreateLeadDeps {
  writer: LeadWriter;
  clock: Clock;
  ids: IdGenerator;
  policyVersion: string;
}

export interface CreateLeadRequest {
  input: NewLeadInput;
  ipHash: string;
}

export function makeCreateLead(deps: CreateLeadDeps) {
  return async function createLeadUseCase(
    req: CreateLeadRequest,
  ): Promise<Result<{ leadId: string }, LeadError>> {
    const now = deps.clock.now();
    const created = createLead(req.input, { id: deps.ids.next(), now });
    if (!created.ok) return err(created.error);

    await deps.writer.saveNew(created.value, {
      kind: "pdpl_form",
      policyVersion: deps.policyVersion,
      granted: true,
      ipHash: req.ipHash,
      grantedAt: now,
    });
    return ok({ leadId: created.value.id });
  };
}
