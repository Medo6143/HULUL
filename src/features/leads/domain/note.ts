import type { LeadError } from "./lead.errors";
import { err, ok, type Result } from "./result";

export const NOTE_MAX = 2000;

export interface LeadNote {
  id: string;
  leadId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

/** Notes are saved with their author and time; empty or oversized notes are rejected. */
export function createNote(
  input: { leadId: string; authorUid: string; authorName: string; text: string },
  ctx: { id: string; now: Date },
): Result<LeadNote, LeadError> {
  const text = input.text.trim();
  if (text.length === 0 || text.length > NOTE_MAX) return err({ code: "invalid_note" });
  return ok({
    id: ctx.id,
    leadId: input.leadId,
    authorUid: input.authorUid,
    authorName: input.authorName,
    text,
    createdAt: ctx.now,
  });
}
