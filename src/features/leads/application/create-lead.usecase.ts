import { createLead, type NewLeadInput } from "../domain/lead";
import type { LeadError } from "../domain/lead.errors";
import { err, ok, type Result } from "../domain/result";
import type { Clock, IdGenerator, LeadEvents, LeadWriter } from "./ports";

export interface CreateLeadDeps {
  writer: LeadWriter;
  clock: Clock;
  ids: IdGenerator;
  policyVersion: string;
  events?: LeadEvents;
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
    const lead = created.value;
    try {
      await deps.events?.leadCreated({
        kind: "lead.created",
        leadId: lead.id,
        type: lead.type,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        service: lead.service,
        description: lead.description,
        locale: lead.locale,
        landingPage: lead.source.landingPage,
      });
    } catch {
      // The lead is already saved; a notification problem must not turn that into an error.
    }
    return ok({ leadId: lead.id });
  };
}
