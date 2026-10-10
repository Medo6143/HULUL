import { describe, expect, it } from "vitest";
import { makeSaveRecipients } from "@/features/notifications/application/recipients.usecase";
import { normalizeRecipients } from "@/features/notifications/domain/recipients";
import type { InviteSender } from "@/features/team/application/ports";
import {
  makeChangeOwnPassword,
  makeDeleteStaff,
  makeSetStaffPassword,
  makeInviteStaff,
  makeListStaff,
  makeResendInvite,
  makeSetStaffDisabled,
  makeSetStaffRole,
} from "@/features/team/application/usecases";
import { buildInviteEmail, buildPasswordResetEmail } from "@/features/team/domain/invite-email";
import { InMemoryStaffDirectory } from "@/features/team/infrastructure/in-memory-staff.directory";

function setup() {
  const directory = new InMemoryStaffDirectory();
  directory.seed({ uid: "o1", email: "owner@example.com", role: "owner" });
  directory.seed({ uid: "a1", email: "agent@example.com", role: "agent" });
  const sent: { to: string; link: string; name: string }[] = [];
  const invites: InviteSender = {
    async send(input) {
      sent.push({ to: input.to, link: input.link, name: input.name });
      return true;
    },
  };
  return { directory, invites, sent };
}

describe("inviting staff", () => {
  it("creates the member with the role and emails the setup link", async () => {
    const { directory, invites, sent } = setup();
    const result = await makeInviteStaff({ directory, invites })({ email: " New@Example.com ", name: "Sara", role: "agent" });
    expect(result.ok && result.value.emailed).toBe(true);
    const member = await directory.findByEmail("new@example.com");
    expect(member).toMatchObject({ role: "agent", name: "Sara" });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.link).toContain("new%40example.com");
  });
  it("rejects bad emails, bad roles, and existing accounts", async () => {
    const { directory, invites } = setup();
    const invite = makeInviteStaff({ directory, invites });
    expect(await invite({ email: "nope", name: "", role: "agent" })).toMatchObject({ ok: false, error: { code: "invalid_email" } });
    expect(await invite({ email: "x@example.com", name: "", role: "root" })).toMatchObject({ ok: false, error: { code: "invalid_role" } });
    expect(await invite({ email: "agent@example.com", name: "", role: "agent" })).toMatchObject({ ok: false, error: { code: "email_exists" } });
  });
  it("keeps the account and reports it when the email cannot be sent, and can resend", async () => {
    const { directory } = setup();
    const failing: InviteSender = { send: async () => false };
    const result = await makeInviteStaff({ directory, invites: failing })({ email: "late@example.com", name: "", role: "agent" });
    expect(result.ok && result.value.emailed).toBe(false);
    const uid = result.ok ? result.value.uid : "";
    const working: InviteSender = { send: async () => true };
    expect(await makeResendInvite({ directory, invites: working })(uid)).toMatchObject({ ok: true, value: { emailed: true } });
    expect(await makeResendInvite({ directory, invites: working })("missing")).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
  it("lists members sorted by email", async () => {
    const { directory } = setup();
    expect((await makeListStaff({ directory })()).map((m) => m.email)).toEqual(["agent@example.com", "owner@example.com"]);
  });
});

describe("changing roles and access", () => {
  it("lets an owner change another member's role", async () => {
    const { directory } = setup();
    const r = await makeSetStaffRole({ directory })({ actorUid: "o1", uid: "a1", role: "owner" });
    expect(r.ok).toBe(true);
    expect((await directory.findByEmail("agent@example.com"))?.role).toBe("owner");
  });
  it("blocks changing your own role or disabling yourself", async () => {
    const { directory } = setup();
    expect(await makeSetStaffRole({ directory })({ actorUid: "o1", uid: "o1", role: "agent" })).toMatchObject({ ok: false, error: { code: "self_change" } });
    expect(await makeSetStaffDisabled({ directory })({ actorUid: "o1", uid: "o1", disabled: true })).toMatchObject({ ok: false, error: { code: "self_change" } });
  });
  it("never removes or disables the last active owner", async () => {
    const { directory } = setup();
    directory.seed({ uid: "o2", email: "second@example.com", role: "owner" });
    // Two owners: one can demote the other.
    expect((await makeSetStaffRole({ directory })({ actorUid: "o1", uid: "o2", role: "agent" })).ok).toBe(true);
    // Now o1 is the only owner; an agent promoted to owner acts, then tries to demote o1 after o1 is the sole active owner.
    directory.seed({ uid: "a2", email: "actor@example.com", role: "agent" });
    expect(await makeSetStaffRole({ directory })({ actorUid: "a2", uid: "o1", role: "agent" })).toMatchObject({ ok: false, error: { code: "last_owner" } });
    expect(await makeSetStaffDisabled({ directory })({ actorUid: "a2", uid: "o1", disabled: true })).toMatchObject({ ok: false, error: { code: "last_owner" } });
  });
  it("reports unknown members and bad roles", async () => {
    const { directory } = setup();
    expect(await makeSetStaffRole({ directory })({ actorUid: "o1", uid: "zzz", role: "agent" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await makeSetStaffRole({ directory })({ actorUid: "o1", uid: "a1", role: "god" })).toMatchObject({ ok: false, error: { code: "invalid_role" } });
  });
  it("disables and re-enables a member", async () => {
    const { directory } = setup();
    await makeSetStaffDisabled({ directory })({ actorUid: "o1", uid: "a1", disabled: true });
    expect((await directory.findByEmail("agent@example.com"))?.disabled).toBe(true);
    await makeSetStaffDisabled({ directory })({ actorUid: "o1", uid: "a1", disabled: false });
    expect((await directory.findByEmail("agent@example.com"))?.disabled).toBe(false);
  });
});

describe("invitation email", () => {
  it("escapes the name and keeps the link intact, with no emoji", () => {
    const mail = buildInviteEmail({ name: "<script>x</script>", link: "https://example.test/reset?a=1&b=2", role: "agent" });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain('href="https://example.test/reset?a=1&amp;b=2"');
    expect(mail.text).toContain("https://example.test/reset?a=1&b=2");
    expect(mail.text + mail.subject).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe("alert recipients", () => {
  it("normalizes, dedupes, and validates", () => {
    expect(normalizeRecipients([" A@Example.com ", "a@example.com", "", "b@example.com"])).toEqual({
      ok: true,
      value: ["a@example.com", "b@example.com"],
    });
    expect(normalizeRecipients(["not-an-email"])).toMatchObject({ ok: false, error: { code: "invalid_email" } });
    expect(normalizeRecipients(["", "  "])).toMatchObject({ ok: false, error: { code: "empty" } });
    expect(normalizeRecipients(Array.from({ length: 11 }, (_, i) => `u${i}@example.com`))).toMatchObject({ ok: false, error: { code: "too_many" } });
  });
  it("saves the cleaned list with who changed it", async () => {
    const saved: { list: string[]; by: string }[] = [];
    const save = makeSaveRecipients({ store: { list: async () => [], save: async (list, by) => void saved.push({ list, by }) } });
    expect(await save({ recipients: ["X@Example.com"], updatedBy: "owner@example.com" })).toMatchObject({ ok: true });
    expect(saved).toEqual([{ list: ["x@example.com"], by: "owner@example.com" }]);
    expect(await save({ recipients: [], updatedBy: "o" })).toMatchObject({ ok: false });
    expect(saved).toHaveLength(1);
  });
});

describe("deleting members", () => {
  it("deletes another member but never yourself or the last active owner", async () => {
    const { directory } = setup();
    const remove = makeDeleteStaff({ directory });
    expect(await remove({ actorUid: "o1", uid: "o1" })).toMatchObject({ ok: false, error: { code: "self_change" } });
    expect(await remove({ actorUid: "a1", uid: "o1" })).toMatchObject({ ok: false, error: { code: "last_owner" } });
    expect(await remove({ actorUid: "o1", uid: "zzz" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect((await remove({ actorUid: "o1", uid: "a1" })).ok).toBe(true);
    expect(await directory.findByEmail("agent@example.com")).toBeNull();
  });
  it("lets an owner be deleted when another active owner remains", async () => {
    const { directory } = setup();
    directory.seed({ uid: "o2", email: "second@example.com", role: "owner" });
    expect((await makeDeleteStaff({ directory })({ actorUid: "o1", uid: "o2" })).ok).toBe(true);
  });
});

describe("passwords", () => {
  it("owner sets another member's password, with length and self checks", async () => {
    const { directory } = setup();
    const set = makeSetStaffPassword({ directory });
    expect(await set({ actorUid: "o1", uid: "a1", password: "short" })).toMatchObject({ ok: false, error: { code: "weak_password" } });
    expect(await set({ actorUid: "o1", uid: "o1", password: "long-enough-pass" })).toMatchObject({ ok: false, error: { code: "self_change" } });
    expect(await set({ actorUid: "o1", uid: "zzz", password: "long-enough-pass" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect((await set({ actorUid: "o1", uid: "a1", password: "long-enough-pass" })).ok).toBe(true);
    expect(directory.passwords.get("a1")).toBe("long-enough-pass");
  });
  it("changing your own password needs the right current one and a new, long-enough one", async () => {
    const { directory } = setup();
    const verifier = (result: "ok" | "wrong" | "too_many" | "failed") => ({ verify: async () => result });
    const base = { uid: "a1", email: "agent@example.com", current: "old-password-1", next: "new-password-22" };
    expect((await makeChangeOwnPassword({ directory, verifier: verifier("ok") })(base)).ok).toBe(true);
    expect(directory.passwords.get("a1")).toBe("new-password-22");
    expect(await makeChangeOwnPassword({ directory, verifier: verifier("wrong") })(base)).toMatchObject({ ok: false, error: { code: "wrong_password" } });
    expect(await makeChangeOwnPassword({ directory, verifier: verifier("failed") })(base)).toMatchObject({ ok: false, error: { code: "wrong_password" } });
    expect(await makeChangeOwnPassword({ directory, verifier: verifier("too_many") })(base)).toMatchObject({ ok: false, error: { code: "too_many_attempts" } });
    expect(await makeChangeOwnPassword({ directory, verifier: verifier("ok") })({ ...base, next: "short" })).toMatchObject({ ok: false, error: { code: "weak_password" } });
    expect(await makeChangeOwnPassword({ directory, verifier: verifier("ok") })({ ...base, next: base.current })).toMatchObject({ ok: false, error: { code: "weak_password" } });
  });
  it("does not change the password when the current one is wrong", async () => {
    const { directory } = setup();
    await makeChangeOwnPassword({ directory, verifier: { verify: async () => "wrong" } })({ uid: "a1", email: "x", current: "c", next: "new-password-22" });
    expect(directory.passwords.has("a1")).toBe(false);
  });
  it("sends a reset email with the reset wording, escaped, and no emoji", async () => {
    const mail = buildPasswordResetEmail({ name: "<b>سارة</b>", link: "https://example.test/r?a=1&b=2" });
    expect(mail.html).not.toContain("<b>سارة</b>");
    expect(mail.html).toContain("&amp;b=2");
    expect(mail.text).toContain("https://example.test/r?a=1&b=2");
    expect(mail.subject).toContain("إعادة تعيين");
    expect(mail.subject + mail.text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it("passes the reset kind to the sender", async () => {
    const { directory } = setup();
    const kinds: (string | undefined)[] = [];
    const { makeResendInvite } = await import("@/features/team/application/usecases");
    const resend = makeResendInvite({ directory, invites: { send: async (i) => (kinds.push(i.kind), true) } });
    await resend("a1", "reset");
    await resend("a1");
    expect(kinds).toEqual(["reset", "invite"]);
  });
});
