export { makeNotificationService } from "./application/service";
export type { NotificationService } from "./application/service";
export type { ContactReceivedEvent, LeadCreatedEvent } from "./domain/events";
export type { RecipientStore, EmailAttachment, NotificationEventName } from "./application/ports";
export type { TransactionalEmail } from "./application/service";
export type { RenderedEmail } from "./domain/events";
export { makeSaveRecipients } from "./application/recipients.usecase";
export { MAX_RECIPIENTS, normalizeRecipients } from "./domain/recipients";
export type { RecipientsError } from "./domain/recipients";
