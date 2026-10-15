import { normalizeTelegramChats, type TelegramChat, type TelegramChatsError } from "../domain/telegram";
import type { SendOutcome } from "./ports";

export interface TelegramChatStore {
  /** Saved chats, or an empty list when the owner has not added any. */
  list(): Promise<TelegramChat[]>;
  save(chats: TelegramChat[], updatedBy: string): Promise<void>;
}

/** The Telegram Bot API as the app needs it. `configured` is false without a bot token. */
export interface TelegramBot {
  readonly configured: boolean;
  /** The bot's @username, so the owner knows which bot people must open. Null when unreachable. */
  username(): Promise<string | null>;
  /** Chats that recently wrote to the bot (they pressed Start or sent a message). */
  recentChats(): Promise<TelegramChat[]>;
  send(chatId: string, text: string): Promise<SendOutcome>;
}

export function makeSaveTelegramChats(deps: { store: TelegramChatStore }) {
  return async function saveTelegramChats(req: {
    chats: TelegramChat[];
    updatedBy: string;
  }): Promise<{ ok: true; value: TelegramChat[] } | { ok: false; error: TelegramChatsError }> {
    const normalized = normalizeTelegramChats(req.chats);
    if (!normalized.ok) return normalized;
    await deps.store.save(normalized.value, req.updatedBy);
    return normalized;
  };
}

/** Chats that messaged the bot and are not on the owner's list yet. */
export function makeDiscoverTelegramChats(deps: { bot: TelegramBot; store: TelegramChatStore }) {
  return async function discover(): Promise<{ ok: true; chats: TelegramChat[] } | { ok: false; reason: "not_configured" | "unreachable" }> {
    if (!deps.bot.configured) return { ok: false, reason: "not_configured" };
    try {
      const [recent, saved] = await Promise.all([deps.bot.recentChats(), deps.store.list()]);
      const known = new Set(saved.map((chat) => chat.id));
      return { ok: true, chats: recent.filter((chat) => !known.has(chat.id)) };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  };
}

/** Sends a test message to one saved chat (never to an arbitrary id), so the owner can check it works. */
export function makeSendTelegramTest(deps: { bot: TelegramBot; store: TelegramChatStore }) {
  return async function sendTest(req: { chatId: string; text: string }): Promise<{ ok: true } | { ok: false; reason: "not_configured" | "unknown_chat" | "failed" }> {
    if (!deps.bot.configured) return { ok: false, reason: "not_configured" };
    const saved = await deps.store.list();
    if (!saved.some((chat) => chat.id === req.chatId)) return { ok: false, reason: "unknown_chat" };
    const outcome = await deps.bot.send(req.chatId, req.text);
    return outcome.ok ? { ok: true } : { ok: false, reason: "failed" };
  };
}
