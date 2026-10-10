import type { ChatAlerter, SendOutcome } from "../application/ports";

/** Optional team chat alert. Skipped when the bot token or chat id is not configured. */
export class TelegramChatAlerter implements ChatAlerter {
  constructor(
    private readonly botToken: string,
    private readonly chatId: string,
  ) {}

  async send(text: string): Promise<SendOutcome> {
    if (!this.botToken || !this.chatId) return { ok: false, skipped: true };

    const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(this.botToken)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: this.chatId, text }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return { ok: true };
    return { ok: false, error: `telegram_${response.status}` };
  }
}
