import type { ChatAlerter, SendOutcome } from "../application/ports";
import type { TelegramBot, TelegramChatStore } from "../application/telegram.usecases";

/**
 * Team chat alert: one message to every chat the owner added in the admin. With no chats saved it falls back to
 * the chat id from the environment. It is skipped when there is no bot token or no chat at all.
 */
export class TelegramChatAlerter implements ChatAlerter {
  constructor(
    private readonly bot: TelegramBot,
    private readonly store: TelegramChatStore,
    private readonly fallbackChatId: string,
  ) {}

  async send(text: string): Promise<SendOutcome> {
    if (!this.bot.configured) return { ok: false, skipped: true };

    let ids: string[] = [];
    try {
      ids = (await this.store.list()).map((chat) => chat.id);
    } catch {
      ids = [];
    }
    if (ids.length === 0 && this.fallbackChatId) ids = [this.fallbackChatId];
    if (ids.length === 0) return { ok: false, skipped: true };

    const outcomes = await Promise.all(ids.map((id) => this.bot.send(id, text)));
    if (outcomes.some((outcome) => outcome.ok)) return { ok: true };
    const first = outcomes.find((outcome) => !outcome.ok && !("skipped" in outcome && outcome.skipped));
    return { ok: false, error: first && "error" in first ? first.error : "telegram_failed" };
  }
}
