import { describe, expect, it } from "vitest";
import { makeDiscoverTelegramChats, makeNotificationService, makeSaveTelegramChats, makeSendTelegramTest, normalizeTelegramChats, type TelegramChatStore } from "@/features/notifications";
import { chatsFromUpdates, telegramChatsFromStored } from "@/features/notifications/domain/telegram";
import { TelegramBotClient } from "@/features/notifications/infrastructure/telegram-bot";
import { TelegramChatAlerter } from "@/features/notifications/infrastructure/telegram-chat.alerter";

interface Call {
  url: string;
  body: Record<string, unknown>;
}

/** A fake Telegram API. Chats listed in `blocked` answer 403, like people who never pressed Start. */
function fakeTelegram(opts: { blocked?: string[]; updates?: unknown[] } = {}) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    calls.push({ url, body });
    if (url.endsWith("/getMe")) return new Response(JSON.stringify({ ok: true, result: { username: "hulol_bot" } }));
    if (url.endsWith("/getUpdates")) return new Response(JSON.stringify({ ok: true, result: opts.updates ?? [] }));
    if (url.endsWith("/sendMessage")) return new Response("{}", { status: opts.blocked?.includes(String(body.chat_id)) ? 403 : 200 });
    return new Response("{}", { status: 404 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const memoryStore = (initial: { id: string; name: string }[] = []): TelegramChatStore & { saved: { id: string; name: string }[] } => {
  const store = {
    saved: initial,
    async list() {
      return store.saved;
    },
    async save(chats: { id: string; name: string }[]) {
      store.saved = chats;
    },
  };
  return store;
};

describe("telegram chat list", () => {
  it("accepts user and group ids, trims, drops blanks and duplicates, and names are optional", () => {
    const r = normalizeTelegramChats([{ id: " 123456789 ", name: " Sara " }, { id: "", name: "x" }, { id: "123456789", name: "dup" }, { id: "-1001234567890", name: "فريق" }]);
    expect(r).toEqual({ ok: true, value: [{ id: "123456789", name: "Sara" }, { id: "-1001234567890", name: "فريق" }] });
  });
  it("rejects phone numbers, usernames, and text, and caps the list at ten", () => {
    for (const id of ["+966501234567", "@sara", "abc", "12", "0123456"]) {
      expect(normalizeTelegramChats([{ id, name: "" }])).toMatchObject({ ok: false, error: { code: "invalid_chat_id" } });
    }
    const many = Array.from({ length: 11 }, (_, i) => ({ id: String(100000 + i), name: "" }));
    expect(normalizeTelegramChats(many)).toMatchObject({ ok: false, error: { code: "too_many" } });
  });
  it("reads stored documents defensively", () => {
    expect(telegramChatsFromStored(undefined)).toEqual([]);
    expect(telegramChatsFromStored([{ id: "123456", name: "A" }, { id: "bad" }, 5, null, { id: 99999, name: "n" }])).toEqual([{ id: "123456", name: "A" }]);
  });
  it("saves the cleaned list and rejects a bad one without saving", async () => {
    const store = memoryStore();
    const save = makeSaveTelegramChats({ store });
    expect((await save({ chats: [{ id: "123456", name: "A" }], updatedBy: "o" })).ok).toBe(true);
    expect(store.saved).toEqual([{ id: "123456", name: "A" }]);
    expect(await save({ chats: [{ id: "oops", name: "" }], updatedBy: "o" })).toMatchObject({ ok: false });
    expect(store.saved).toHaveLength(1);
  });
});

describe("finding people who started the bot", () => {
  const updates = [
    { message: { chat: { id: 111111, type: "private", first_name: "Sara", last_name: "Ali" } } },
    { message: { chat: { id: 222222, type: "private", username: "omar" } } },
    { message: { chat: { id: 111111, type: "private", first_name: "Sara", last_name: "Ali" } } },
    { message: { chat: { id: -100999999, type: "supergroup", title: "Hulol Team" } } },
    { message: { chat: { id: -100888888, type: "channel", title: "News" } } },
    { edited_message: {} },
  ];
  it("lists distinct private chats and groups with readable names, newest first, and skips channels", () => {
    expect(chatsFromUpdates(updates)).toEqual([
      { id: "-100999999", name: "Hulol Team" },
      { id: "111111", name: "Sara Ali" },
      { id: "222222", name: "@omar" },
    ]);
  });
  it("hides chats that are already on the list, and reports a missing token", async () => {
    const { fetchImpl } = fakeTelegram({ updates });
    const bot = new TelegramBotClient("token", fetchImpl);
    const discover = makeDiscoverTelegramChats({ bot, store: memoryStore([{ id: "111111", name: "Sara" }]) });
    const result = await discover();
    expect(result.ok && result.chats.map((c) => c.id)).toEqual(["-100999999", "222222"]);
    expect(await makeDiscoverTelegramChats({ bot: new TelegramBotClient("", fetchImpl), store: memoryStore() })()).toEqual({ ok: false, reason: "not_configured" });
  });
  it("reads the bot username", async () => {
    expect(await new TelegramBotClient("token", fakeTelegram().fetchImpl).username()).toBe("hulol_bot");
    expect(await new TelegramBotClient("").username()).toBeNull();
  });
});

describe("sending alerts to every chat", () => {
  it("messages each saved chat once, and counts the alert sent if any chat got it", async () => {
    const { calls, fetchImpl } = fakeTelegram({ blocked: ["222222"] });
    const alerter = new TelegramChatAlerter(new TelegramBotClient("token", fetchImpl), memoryStore([{ id: "111111", name: "A" }, { id: "222222", name: "B" }]), "");
    expect(await alerter.send("طلب جديد")).toEqual({ ok: true });
    expect(calls.filter((c) => c.url.endsWith("/sendMessage")).map((c) => c.body.chat_id).sort()).toEqual(["111111", "222222"]);
  });
  it("reports a failure only when nobody got it, and falls back to the environment chat when the list is empty", async () => {
    const all = fakeTelegram({ blocked: ["111111"] });
    const failing = new TelegramChatAlerter(new TelegramBotClient("token", all.fetchImpl), memoryStore([{ id: "111111", name: "A" }]), "");
    expect(await failing.send("x")).toEqual({ ok: false, error: "telegram_403" });
    const env = fakeTelegram();
    const fallback = new TelegramChatAlerter(new TelegramBotClient("token", env.fetchImpl), memoryStore(), "555555");
    expect(await fallback.send("x")).toEqual({ ok: true });
    expect(env.calls[0]?.body.chat_id).toBe("555555");
  });
  it("is skipped without a token, or without any chat", async () => {
    const { fetchImpl, calls } = fakeTelegram();
    expect(await new TelegramChatAlerter(new TelegramBotClient("", fetchImpl), memoryStore([{ id: "111111", name: "A" }]), "").send("x")).toMatchObject({ ok: false, skipped: true });
    expect(await new TelegramChatAlerter(new TelegramBotClient("token", fetchImpl), memoryStore(), "").send("x")).toMatchObject({ ok: false, skipped: true });
    expect(calls).toHaveLength(0);
  });
  it("sends a test only to a chat that is on the saved list", async () => {
    const { calls, fetchImpl } = fakeTelegram();
    const sendTest = makeSendTelegramTest({ bot: new TelegramBotClient("token", fetchImpl), store: memoryStore([{ id: "111111", name: "A" }]) });
    expect(await sendTest({ chatId: "111111", text: "hi" })).toEqual({ ok: true });
    expect(await sendTest({ chatId: "999999", text: "hi" })).toEqual({ ok: false, reason: "unknown_chat" });
    expect(calls.filter((c) => c.url.endsWith("/sendMessage"))).toHaveLength(1);
  });
  it("logs the chat alert as one team notification and never throws", async () => {
    const logged: { channel: string; status: string }[] = [];
    const service = makeNotificationService({
      email: { send: async () => ({ ok: true }) },
      chat: { send: async () => ({ ok: false, error: "telegram_403" }) },
      log: { record: async (entry) => void logged.push({ channel: entry.channel, status: entry.status }) },
      teamEmails: async () => [],
      clock: { now: () => new Date() },
    });
    expect(await service.alertChat({ event: "booking.created", subjectId: "b1" }, "حجز جديد")).toMatchObject({ ok: false });
    expect(logged).toEqual([{ channel: "chat_team", status: "failed" }]);
  });
});
