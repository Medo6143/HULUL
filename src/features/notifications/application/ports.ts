export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendOutcome = { ok: true } | { ok: false; skipped: true } | { ok: false; skipped?: false; error: string };

export interface EmailSender {
  send(message: EmailMessage): Promise<SendOutcome>;
}

export interface ChatAlerter {
  send(text: string): Promise<SendOutcome>;
}

export interface NotificationLogEntry {
  channel: "email_team" | "email_customer" | "chat_team";
  event: "lead.created" | "contact.received";
  subjectId: string;
  status: "sent" | "failed" | "skipped";
  error: string;
  at: Date;
}

export interface NotificationLog {
  record(entry: NotificationLogEntry): Promise<void>;
}
