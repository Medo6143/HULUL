import type { EmailMessage, EmailSender, SendOutcome } from "../application/ports";

/** Sends through the Resend API. Without a key or a sender address it reports `skipped` instead of failing. */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<SendOutcome> {
    if (!this.apiKey || !this.from || !message.to) return { ok: false, skipped: true };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return { ok: true };
    return { ok: false, error: `resend_${response.status}` };
  }
}
