import { normalizeRecipients, type RecipientsError } from "../domain/recipients";
import type { RecipientStore } from "./ports";

export function makeSaveRecipients(deps: { store: RecipientStore }) {
  return async function saveRecipients(req: {
    recipients: string[];
    updatedBy: string;
  }): Promise<{ ok: true; value: string[] } | { ok: false; error: RecipientsError }> {
    const normalized = normalizeRecipients(req.recipients);
    if (!normalized.ok) return normalized;
    await deps.store.save(normalized.value, req.updatedBy);
    return normalized;
  };
}
