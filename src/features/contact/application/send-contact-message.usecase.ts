import {
  createContactMessage,
  type ContactError,
  type NewContactMessage,
  type Result,
} from "../domain/contact-message";
import type { Clock, ContactWriter, IdGenerator } from "./ports";

export interface SendContactMessageDeps {
  writer: ContactWriter;
  clock: Clock;
  ids: IdGenerator;
  policyVersion: string;
}

export function makeSendContactMessage(deps: SendContactMessageDeps) {
  return async function sendContactMessage(req: {
    input: NewContactMessage;
    ipHash: string;
  }): Promise<Result<{ id: string }, ContactError>> {
    const now = deps.clock.now();
    const created = createContactMessage(req.input, { id: deps.ids.next(), now });
    if (!created.ok) return created;

    await deps.writer.save(created.value, {
      kind: "pdpl_form",
      policyVersion: deps.policyVersion,
      granted: true,
      ipHash: req.ipHash,
      grantedAt: now,
    });
    return { ok: true, value: { id: created.value.id } };
  };
}
