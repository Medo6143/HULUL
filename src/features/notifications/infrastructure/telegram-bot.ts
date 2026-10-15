import type { SendOutcome } from "../application/ports";
import type { TelegramBot } from "../application/telegram.usecases";
import { chatsFromUpdates, type TelegramChat } from "../domain/telegram";

type Fetch = typeof fetch;

/** Thin client for the Telegram Bot API. Without a token every call is skipped or empty. */
export class TelegramBotClient implements TelegramBot {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  get configured(): boolean {
    return this.token.length > 0;
  }

  private url(method: string): string {
    return `https://api.telegram.org/bot${encodeURIComponent(this.token)}/${method}`;
  }

  async username(): Promise<string | null> {
    if (!this.configured) return null;
    try {
      const response = await this.fetchImpl(this.url("getMe"), { signal: AbortSignal.timeout(5_000) });
      const data = (await response.json()) as { ok?: boolean; result?: { username?: string } };
      return data.ok && data.result?.username ? data.result.username : null;
    } catch {
      return null;
    }
  }

  async recentChats(): Promise<TelegramChat[]> {
    const response = await this.fetchImpl(this.url("getUpdates"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 100, timeout: 0, allowed_updates: ["message", "my_chat_member"] }),
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await response.json()) as { ok?: boolean; result?: unknown[] };
    if (!response.ok || !data.ok || !Array.isArray(data.result)) throw new Error(`telegram_${response.status}`);
    return chatsFromUpdates(data.result as Parameters<typeof chatsFromUpdates>[0]);
  }

  async send(chatId: string, text: string): Promise<SendOutcome> {
    if (!this.configured) return { ok: false, skipped: true };
    try {
      const response = await this.fetchImpl(this.url("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(8_000),
      });
      return response.ok ? { ok: true } : { ok: false, error: `telegram_${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.name : "telegram_failed" };
    }
  }
}
