export { makeGetTemplates, makeSaveTemplates, makeSendInviteEmail } from "./application/usecases";
export type { InviteLeadLookup, InviteMailer, TemplateStore } from "./application/usecases";
export {
  DEFAULT_TEMPLATES,
  MAX_LENGTHS,
  TEMPLATE_VARIABLES,
  normalizeTemplates,
  pickText,
  renderTemplate,
  toInviteEmail,
  whatsappLink,
} from "./domain/templates";
export type { InviteTemplates, TemplateError, TemplateValues, TemplateVariable } from "./domain/templates";
