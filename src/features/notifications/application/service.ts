import type { ContactReceivedEvent, LeadCreatedEvent, RenderedEmail } from "../domain/events";
import {
  renderContactAlert,
  renderContactConfirmation,
  renderLeadAlert,
  renderLeadConfirmation,
} from "../domain/templates";
import type { ChatAlerter, EmailSender, NotificationLog, NotificationLogEntry, SendOutcome } from "./ports";

export interface NotificationDeps {
  email: EmailSender;
  chat: ChatAlerter;
  log: NotificationLog;
  teamEmail: string;
  clock: { now(): Date };
}

/**
 * Sends the team alert and the customer confirmation for new leads and contact messages.
 * It never throws: a failed email must not fail the request that created the lead. Every attempt is logged.
 */
export function makeNotificationService(deps: NotificationDeps) {
  async function attempt(
    entry: Omit<NotificationLogEntry, "status" | "error" | "at">,
    run: () => Promise<SendOutcome>,
  ): Promise<void> {
    let status: NotificationLogEntry["status"] = "sent";
    let error = "";
    try {
      const outcome = await run();
      if (!outcome.ok) {
        status = outcome.skipped ? "skipped" : "failed";
        error = outcome.skipped ? "" : (outcome as { error: string }).error;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : "unknown";
    }
    try {
      await deps.log.record({ ...entry, status, error, at: deps.clock.now() });
    } catch {
      // Logging is best effort.
    }
  }

  const mail = (to: string, rendered: RenderedEmail) => deps.email.send({ to, ...rendered });

  return {
    async leadCreated(event: LeadCreatedEvent): Promise<void> {
      const base = { event: event.kind, subjectId: event.leadId } as const;
      const alert = renderLeadAlert(event);
      await Promise.all([
        attempt({ ...base, channel: "email_team" }, () => mail(deps.teamEmail, alert)),
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
        attempt({ ...base, channel: "email_team" }, () => mail(deps.teamEmail, alert)),
        attempt({ ...base, channel: "chat_team" }, () => deps.chat.send(`${alert.subject}\n${event.email}`)),
        attempt({ ...base, channel: "email_customer" }, () => mail(event.email, renderContactConfirmation(event))),
      ]);
    },
  };
}

export type NotificationService = ReturnType<typeof makeNotificationService>;
