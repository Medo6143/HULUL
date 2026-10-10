export interface EmailAttachment {
  filename: string;
  /** Base64 content. */
  content: string;
  contentType: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}

export type SendOutcome = { ok: true } | { ok: false; skipped: true } | { ok: false; skipped?: false; error: string };

export interface EmailSender {
  send(message: EmailMessage): Promise<SendOutcome>;
}

export interface ChatAlerter {
  send(text: string): Promise<SendOutcome>;
}

export type NotificationEventName =
  | "lead.created"
  | "contact.received"
  | "booking.created"
  | "booking.cancelled"
  | "invite.email"
  | "team.invite";

export interface NotificationLogEntry {
  channel: "email_team" | "email_customer" | "chat_team" | "email_staff";
  event: NotificationEventName;
  subjectId: string;
  status: "sent" | "failed" | "skipped";
  error: string;
  at: Date;
}

export interface NotificationLog {
  record(entry: NotificationLogEntry): Promise<void>;
}

/** Where alert emails go. Backed by a Firestore settings document, with the env address as fallback. */
export interface RecipientStore {
  list(): Promise<string[]>;
  save(recipients: string[], updatedBy: string): Promise<void>;
}
