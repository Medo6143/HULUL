import type { LeadError } from "../domain/lead.errors";
import { createNote } from "../domain/note";
import { err, ok, type Result } from "../domain/result";
import type { Clock, IdGenerator, LeadNoteStore, LeadReader } from "./ports";

export function makeAddLeadNote(deps: { reader: LeadReader; notes: LeadNoteStore; clock: Clock; ids: IdGenerator }) {
  return async function addLeadNoteUseCase(req: {
    leadId: string;
    authorUid: string;
    authorName: string;
    text: string;
  }): Promise<Result<null, LeadError>> {
    const lead = await deps.reader.findById(req.leadId);
    if (!lead) return err({ code: "not_found" });

    const note = createNote(req, { id: deps.ids.next(), now: deps.clock.now() });
    if (!note.ok) return err(note.error);

    await deps.notes.addNote(note.value);
    return ok(null);
  };
}
