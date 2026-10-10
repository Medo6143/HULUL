"use client";

import { KeyRound, Loader2, MailPlus, Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "./format";

export interface TeamRow {
  uid: string;
  email: string;
  name: string;
  role: "owner" | "agent";
  disabled: boolean;
  lastSignInAt: string | null;
}

const ERROR_KEYS = [
  "invalid_email",
  "invalid_role",
  "weak_password",
  "email_exists",
  "last_owner",
  "self_change",
  "not_found",
  "unauthorized",
  "forbidden",
  "invalid_input",
] as const;

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; code?: string; emailed?: boolean; passwordSet?: boolean }> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; emailed?: boolean; passwordSet?: boolean; error?: { code?: string } }
      | null;
    if (response.ok) return { ok: true, emailed: data?.emailed, passwordSet: data?.passwordSet };
    return { ok: false, code: data?.error?.code ?? "internal_error" };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

export function TeamView({ members, currentUid, demo }: { members: TeamRow[]; currentUid: string; demo: boolean }) {
  const t = useTranslations("admin.team");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"agent" | "owner">("agent");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);

  const errorText = (code?: string) =>
    (ERROR_KEYS as readonly string[]).includes(code ?? "") ? t(`errors.${code}`) : t("errors.internal_error");

  async function invite(event: FormEvent) {
    event.preventDefault();
    setBusy("invite");
    setMessage(null);
    const result = await call("/api/admin/team", "POST", { email, name, role, password });
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    setEmail("");
    setName("");
    setPassword("");
    setMessage(
      result.passwordSet
        ? { kind: "ok", text: t("passwordCreated") }
        : result.emailed
          ? { kind: "ok", text: t("inviteSent") }
          : { kind: "warn", text: t("inviteNotEmailed") },
    );
    router.refresh();
  }

  async function update(uid: string, body: { role?: string; disabled?: boolean }) {
    setBusy(uid);
    setMessage(null);
    const result = await call(`/api/admin/team/${uid}`, "PATCH", body);
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    router.refresh();
  }

  async function remove(uid: string) {
    setBusy(uid);
    setMessage(null);
    const result = await call(`/api/admin/team/${uid}`, "DELETE");
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    setMessage({ kind: "ok", text: t("deleted") });
    router.refresh();
  }

  async function sendReset(uid: string) {
    setBusy(uid);
    setMessage(null);
    const result = await call(`/api/admin/team/${uid}/reset`, "POST");
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    setMessage(result.emailed ? { kind: "ok", text: t("resetSent") } : { kind: "warn", text: t("resetNotEmailed") });
  }

  async function savePassword(uid: string) {
    setBusy(uid);
    setMessage(null);
    const result = await call(`/api/admin/team/${uid}/password`, "POST", { password: newPw });
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    setPwFor(null);
    setNewPw("");
    setMessage({ kind: "ok", text: t("passwordChanged") });
  }

  async function resend(uid: string) {
    setBusy(uid);
    setMessage(null);
    const result = await call(`/api/admin/team/${uid}/invite`, "POST");
    setBusy(null);
    if (!result.ok) return setMessage({ kind: "error", text: errorText(result.code) });
    setMessage(result.emailed ? { kind: "ok", text: t("inviteSent") } : { kind: "warn", text: t("inviteNotEmailed") });
  }

  const field =
    "min-h-12 w-full rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-base focus-visible:border-brand-strong disabled:opacity-50";

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">{t("subtitle")}</p>
      </div>

      <form onSubmit={invite} className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <h2 className="flex items-center gap-2 text-[18px] font-bold">
          <MailPlus className="size-5 text-brand-strong" aria-hidden="true" />
          {t("inviteTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_0.7fr_auto] md:items-end">
          <label className="grid gap-2 text-[15px] font-semibold">
            {t("email")}
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              disabled={demo}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold">
            {t("name")}
            <input value={name} disabled={demo} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold">
            {t("role")}
            <select
              value={role}
              disabled={demo}
              onChange={(e) => setRole(e.target.value as "agent" | "owner")}
              className={field}
            >
              <option value="agent">{t("roles.agent")}</option>
              <option value="owner">{t("roles.owner")}</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={demo || busy !== null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "invite" ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
            {t("send")}
          </button>
        </div>
        <label className="grid max-w-md gap-2 text-[15px] font-semibold">
          {t("tempPassword")}
          <input
            type="text"
            dir="ltr"
            autoComplete="off"
            minLength={10}
            value={password}
            disabled={demo}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          <span className="text-[13px] font-normal text-text-muted">{t("tempPasswordHint")}</span>
        </label>
        <p className="text-[14px] text-text-muted">{t("inviteHint")}</p>
        {message ? (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={cn(
              "rounded-xl p-3 text-[15px]",
              message.kind === "ok" && "bg-success/10 text-success",
              message.kind === "warn" && "bg-warning/10 text-warning",
              message.kind === "error" && "bg-danger/10 text-danger",
            )}
          >
            {message.text}
          </p>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-surface-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-start">
          <thead>
            <tr className="border-b border-surface-line bg-surface-muted text-[14px] text-text-muted">
              {(["member", "role", "status", "lastSignIn"] as const).map((col) => (
                <th key={col} scope="col" className="ps-5 pe-5 py-3 text-start font-semibold">
                  {t(`columns.${col}`)}
                </th>
              ))}
              <th scope="col" className="ps-5 pe-5 py-3">
                <span className="sr-only">{t("columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const self = member.uid === currentUid;
              const working = busy === member.uid;
              return (
              <Fragment key={member.uid}>
                <tr className="border-b border-surface-line last:border-0">
                  <td className="ps-5 pe-5 py-4">
                    <b className="block">
                      {member.name}
                      {self ? <span className="ms-2 rounded-full bg-brand-soft ps-2 pe-2 text-[12px]">{t("you")}</span> : null}
                    </b>
                    <span className="text-[14px] text-text-muted" dir="ltr">
                      {member.email}
                    </span>
                  </td>
                  <td className="ps-5 pe-5 py-4">
                    <select
                      aria-label={t("role")}
                      value={member.role}
                      disabled={demo || self || working}
                      onChange={(e) => update(member.uid, { role: e.target.value })}
                      className="min-h-10 rounded-lg border border-surface-line bg-surface ps-3 pe-3 text-[15px] disabled:opacity-50"
                    >
                      <option value="agent">{t("roles.agent")}</option>
                      <option value="owner">{t("roles.owner")}</option>
                    </select>
                  </td>
                  <td className="ps-5 pe-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full ps-3 pe-3 py-1 text-[14px] font-semibold",
                        member.disabled ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
                      )}
                    >
                      {member.disabled ? t("disabled") : t("active")}
                    </span>
                  </td>
                  <td className="ps-5 pe-5 py-4 text-[14px] text-text-muted">
                    {member.lastSignInAt ? formatDateTime(member.lastSignInAt) : t("neverSignedIn")}
                  </td>
                  <td className="ps-5 pe-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!member.lastSignInAt ? (
                        <button
                          type="button"
                          disabled={demo || working}
                          onClick={() => resend(member.uid)}
                          className="inline-flex min-h-10 items-center rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                        >
                          {t("resendInvite")}
                        </button>
                      ) : null}
                      {!self ? (
                        <>
                          <button
                            type="button"
                            disabled={demo || working}
                            onClick={() => {
                              setPwFor(pwFor === member.uid ? null : member.uid);
                              setNewPw("");
                            }}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                          >
                            <KeyRound className="size-4" aria-hidden="true" />
                            {t("setPassword")}
                          </button>
                          <button
                            type="button"
                            disabled={demo || working}
                            onClick={() => sendReset(member.uid)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                          >
                            <MailPlus className="size-4" aria-hidden="true" />
                            {t("sendReset")}
                          </button>
                          <button
                            type="button"
                            disabled={demo || working}
                            onClick={() => {
                              if (window.confirm(t("confirmDelete", { name: member.name }))) remove(member.uid);
                            }}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold text-danger hover:border-danger disabled:opacity-50"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            {t("delete")}
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        disabled={demo || self || working}
                        onClick={() => update(member.uid, { disabled: !member.disabled })}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                      >
                        {member.disabled ? (
                          <UserCheck className="size-4" aria-hidden="true" />
                        ) : (
                          <UserX className="size-4" aria-hidden="true" />
                        )}
                        {member.disabled ? t("enable") : t("disable")}
                      </button>
                    </div>
                  </td>
                </tr>
                {pwFor === member.uid ? (
                  <tr className="border-b border-surface-line bg-surface-muted last:border-0">
                    <td colSpan={5} className="ps-5 pe-5 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="grid gap-2 text-[14px] font-semibold">
                          {t("newPassword")}
                          <input
                            type="text"
                            dir="ltr"
                            autoComplete="off"
                            minLength={10}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            className={field}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={working || newPw.length < 10}
                          onClick={() => savePassword(member.uid)}
                          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
                        >
                          {t("savePassword")}
                        </button>
                      </div>
                      <p className="mt-2 text-[13px] text-text-muted">{t("newPasswordHint")}</p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
    </div>
  );
}
