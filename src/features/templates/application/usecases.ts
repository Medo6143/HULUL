import {
  DEFAULT_TEMPLATES,
  normalizeTemplates,
  toInviteEmail,
  type InviteTemplates,
  type Result,
  type TemplateError,
} from "../domain/templates";

export interface TemplateStore {
  /** Saved templates, or null when the owner never saved any. */
  get(): Promise<InviteTemplates | null>;
  save(templates: InviteTemplates, updatedBy: string): Promise<void>;
}

/** The lead facts an invitation needs. Resolved by id on the server so the browser never chooses the recipient. */
export interface InviteRecipient {
  email: string;
  name: string;
}

export interface InviteLeadLookup {
  find(leadId: string): Promise<InviteRecipient | null>;
}

export interface InviteMailer {
  send(input: { leadId: string; to: string; subject: string; text: string; html: string }): Promise<boolean>;
}

export function makeGetTemplates(deps: { store: TemplateStore }) {
  return async function getTemplates(): Promise<{ templates: InviteTemplates; isDefault: boolean }> {
    const saved = await deps.store.get();
    return saved ? { templates: saved, isDefault: false } : { templates: DEFAULT_TEMPLATES, isDefault: true };
  };
}

export function makeSaveTemplates(deps: { store: TemplateStore }) {
  return async function saveTemplates(req: { templates: InviteTemplates; updatedBy: string }): Promise<Result<InviteTemplates, TemplateError>> {
    const normalized = normalizeTemplates(req.templates);
    if (!normalized.ok) return normalized;
    await deps.store.save(normalized.value, req.updatedBy);
    return normalized;
  };
}

/** Emails the (staff-edited) invitation to the lead's own address. */
export function makeSendInviteEmail(deps: { leads: InviteLeadLookup; mailer: InviteMailer }) {
  return async function sendInviteEmail(req: { leadId: string; subject: string; body: string }): Promise<Result<null, TemplateError>> {
    const subject = req.subject.trim();
    const body = req.body.trim();
    if (!subject || !body || subject.length > 150 || body.length > 4000) return { ok: false, error: { code: "invalid_input" } };
    const lead = await deps.leads.find(req.leadId);
    if (!lead) return { ok: false, error: { code: "not_found" } };
    if (!lead.email) return { ok: false, error: { code: "no_email" } };
    const mail = toInviteEmail(subject, body);
    const sent = await deps.mailer.send({ leadId: req.leadId, to: lead.email, ...mail });
    return sent ? { ok: true, value: null } : { ok: false, error: { code: "send_failed" } };
  };
}
