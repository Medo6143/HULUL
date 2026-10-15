import type { LeadError } from "../domain/lead.errors";
import { err, ok, type Result } from "../domain/result";
import type { LeadWriter } from "./ports";

export const MAX_DELETE_BATCH = 100;

/** Deletes up to 100 leads at once, with everything stored under them. The caller must be an owner. */
export function makeDeleteLeads(deps: { writer: LeadWriter }) {
  return async function deleteLeadsUseCase(req: { ids: string[] }): Promise<Result<{ deleted: number }, LeadError>> {
    const ids = [...new Set(req.ids.filter((id) => id.trim() !== ""))];
    if (ids.length === 0 || ids.length > MAX_DELETE_BATCH) return err({ code: "not_found" });
    return ok({ deleted: await deps.writer.delete(ids) });
  };
}
