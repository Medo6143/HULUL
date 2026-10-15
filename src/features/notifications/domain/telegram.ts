// Pure domain: who receives the Telegram alerts. A bot can only message a chat that has started it, and it
// addresses chats by a numeric Chat ID (not a phone number): people for private chats, negative numbers for groups.

export interface TelegramChat {
  /** Numeric Chat ID as text, for example "123456789" or "-1001234567890" for a group. */
  id: string;
  /** A label for the owner's list only (the person's or group's name). */
  name: string;
}

export const MAX_TELEGRAM_CHATS = 10;

export type TelegramChatsError = { code: "invalid_chat_id"; id: string } | { code: "too_many" };

const CHAT_ID_RE = /^-?[1-9]\d{4,19}$/;

export const isChatId = (value: string): boolean => CHAT_ID_RE.test(value);

/** Trims, drops empty rows and duplicates, and checks every Chat ID. */
export function normalizeTelegramChats(input: TelegramChat[]): { ok: true; value: TelegramChat[] } | { ok: false; error: TelegramChatsError } {
  const seen = new Set<string>();
  const out: TelegramChat[] = [];
  for (const row of input) {
    const id = row.id.trim();
    if (id === "") continue;
    if (!isChatId(id)) return { ok: false, error: { code: "invalid_chat_id", id } };
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: row.name.trim().slice(0, 60) });
  }
  if (out.length > MAX_TELEGRAM_CHATS) return { ok: false, error: { code: "too_many" } };
  return { ok: true, value: out };
}

/** Reads the chats saved in a document, ignoring anything malformed. */
export function telegramChatsFromStored(raw: unknown): TelegramChat[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { id, name } = item as { id?: unknown; name?: unknown };
    return typeof id === "string" && isChatId(id) ? [{ id, name: typeof name === "string" ? name : "" }] : [];
  });
  return rows.slice(0, MAX_TELEGRAM_CHATS);
}

interface RawUpdate {
  message?: { chat?: { id?: number; type?: string; title?: string; first_name?: string; last_name?: string; username?: string } };
  my_chat_member?: { chat?: { id?: number; type?: string; title?: string; first_name?: string; last_name?: string; username?: string } };
}

/** The distinct private chats and groups found in a getUpdates response, newest first. */
export function chatsFromUpdates(updates: RawUpdate[]): TelegramChat[] {
  const found = new Map<string, TelegramChat>();
  for (const update of [...updates].reverse()) {
    const chat = update.message?.chat ?? update.my_chat_member?.chat;
    if (!chat || typeof chat.id !== "number") continue;
    if (chat.type !== "private" && chat.type !== "group" && chat.type !== "supergroup") continue;
    const id = String(chat.id);
    if (found.has(id) || !isChatId(id)) continue;
    const person = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
    found.set(id, { id, name: (chat.title || person || (chat.username ? `@${chat.username}` : "")).slice(0, 60) });
  }
  return [...found.values()];
}
