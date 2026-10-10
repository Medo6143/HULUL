import type { ContactReceivedEvent, LeadCreatedEvent, RenderedEmail } from "../domain/events";
import {
  renderContactAlert,
  renderContactConfirmation,
  renderLeadAlert,
  renderLeadConfirmation,
} from "../domain/templates";
import type {
  ChatAlerter,
  EmailAttachment,
  EmailSender,
  NotificationLog,
  NotificationLogEntry,
  SendOutcome,
} from "./ports";

export interface NotificationDeps {
  email: EmailSender;
  chat: ChatAlerter;
  log: NotificationLog;
  /** Current alert recipients. Resolved on every notification so changes apply without a redeploy. */
  teamEmails: () => Promise<string[]>;
  clock: { now(): Date };
}

export interface TransactionalEmail {
  event: NotificationLogEntry["event"];
  subjectId: string;
  channel: NotificationLogEntry["channel"];
  to: string;
  message: RenderedEmail;
  attachments?: EmailAttachment[];
}

/**
 * Sends the team alerts and customer confirmations, plus any other transactional email.
 * It never throws: a failed email must not fail the request that triggered it. Every attempt is logged.
 */
export function makeNotificationService(deps: NotificationDeps) {
  async function attempt(
    entry: Omit<NotificationLogEntry, "status" | "error" | "at">,
    run: () => Promise<SendOutcome>,
  ): Promise<SendOutcome> {
    let outcome: SendOutcome;
    let status: NotificationLogEntry["status"] = "sent";
    let error = "";
    try {
      outcome = await run();
      if (!outcome.ok) {
        status = outcome.skipped ? "skipped" : "failed";
        error = outcome.skipped ? "" : (outcome as { error: string }).error;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : "unknown";
      outcome = { ok: false, error };
    }
    try {
      await deps.log.record({ ...entry, status, error, at: deps.clock.now() });
    } catch {
      // Logging is best effort.
    }
    return outcome;
  }

  const mail = (to: string, rendered: RenderedEmail, attachments?: EmailAttachment[]) =>
    deps.email.send({ to, ...rendered, ...(attachments ? { attachments } : {}) });

  /** One alert per recipient; when no recipient is configured a single skipped entry is logged. */
  async function alertTeam(
    base: { event: NotificationLogEntry["event"]; subjectId: string },
    message: RenderedEmail,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    let recipients: string[] = [];
    try {
      recipients = await deps.teamEmails();
    } catch {
      recipients = [];
    }
    if (recipients.length === 0) {
      await attempt({ ...base, channel: "email_team" }, async () => ({ ok: false, skipped: true }));
      return;
    }
    await Promise.all(recipients.map((to) => attempt({ ...base, channel: "email_team" }, () => mail(to, message, attachments))));
  }

  return {
    async leadCreated(event: LeadCreatedEvent): Promise<void> {
      const base = { event: event.kind, subjectId: event.leadId } as const;
      const alert = renderLeadAlert(event);
      await Promise.all([
        alertTeam(base, alert),
        attempt({ ...base, channel: "chat_team" }, () => deps.chat.send(`${alert.subject}\n${event.phone}`)),
        event.email
          ? attempt({ ...base, channel: "email_customer" }, () => mail(event.email, renderLeadConfirmation(event)))
          : Promise.resolve(),
      ]);
    },

    async contactReceived(event: ContactReceivedEvent): Promise<void> {
      const base = { event: event.kind, subjectId: event.messageId } as const;
      const alert = renderContactAlert(event);
      await Promise.all([
        alertTeam(base, alert),
        attempt({ ...base, channel: "chat_team" }, () => deps.chat.send(`${alert.subject}\n${event.email}`)),
        attempt({ ...base, channel: "email_customer" }, () => mail(event.email, renderContactConfirmation(event))),
      ]);
    },

    /** Alerts every configured team recipient with the same message (used by bookings). */
    alertTeamWith(
      base: { event: NotificationLogEntry["event"]; subjectId: string },
      message: RenderedEmail,
      attachments?: EmailAttachment[],
    ): Promise<void> {
      return alertTeam(base, message, attachments);
    },

    /** One email to one address, logged. Returns the outcome so callers (like the admin invite button) can report it. */
    sendEmail(input: TransactionalEmail): Promise<SendOutcome> {
      return attempt(
        { channel: input.channel, event: input.event, subjectId: input.subjectId },
        () => mail(input.to, input.message, input.attachments),
      );
    },
  };
}

export type NotificationService = ReturnType<typeof makeNotificationService>;
