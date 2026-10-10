import {
  checkDelete,
  isStrongEnough,
  checkDisable,
  checkRoleChange,
  isStaffRole,
  normalizeEmail,
  teamErr,
  teamOk,
  type Result,
  type StaffMember,
  type StaffRole,
  type TeamError,
} from "../domain/staff";
import type { InviteSender, PasswordVerifier, StaffDirectory } from "./ports";

export function makeListStaff(deps: { directory: StaffDirectory }) {
  return async function listStaff(): Promise<StaffMember[]> {
    const members = await deps.directory.list();
    return members.sort((a, b) => a.email.localeCompare(b.email));
  };
}

/**
 * Creates the account, gives it the role, and emails a password-setup link. The owner never sees or sets the
 * password. If the email cannot be sent the account still exists and the invite can be resent.
 */
export function makeInviteStaff(deps: { directory: StaffDirectory; invites: InviteSender }) {
  return async function inviteStaff(req: {
    email: string;
    name: string;
    role: string;
    /** Optional temporary password, handed over by the owner instead of an email (no email is sent). */
    password?: string;
  }): Promise<Result<{ uid: string; emailed: boolean; passwordSet: boolean }, TeamError>> {
    const email = normalizeEmail(req.email);
    if (!email.ok) return teamErr(email.error);
    if (!isStaffRole(req.role)) return teamErr({ code: "invalid_role" });
    if (req.password !== undefined && req.password.length < 10) return teamErr({ code: "weak_password" });
    if (await deps.directory.findByEmail(email.value)) return teamErr({ code: "email_exists" });

    const name = req.name.trim().slice(0, 100) || email.value;
    if (req.password) {
      const created = await deps.directory.create({ email: email.value, name, role: req.role, password: req.password });
      return teamOk({ uid: created.uid, emailed: false, passwordSet: true });
    }
    const member = await deps.directory.create({ email: email.value, name, role: req.role });
    const link = await deps.directory.createPasswordSetupLink(email.value);
    const emailed = await deps.invites.send({ uid: member.uid, to: email.value, name, role: req.role, link });
    return teamOk({ uid: member.uid, emailed, passwordSet: false });
  };
}

export function makeResendInvite(deps: { directory: StaffDirectory; invites: InviteSender }) {
  return async function resendInvite(uid: string, kind: "invite" | "reset" = "invite"): Promise<Result<{ emailed: boolean }, TeamError>> {
    const member = (await deps.directory.list()).find((m) => m.uid === uid);
    if (!member) return teamErr({ code: "not_found" });
    const link = await deps.directory.createPasswordSetupLink(member.email);
    const emailed = await deps.invites.send({ uid, to: member.email, name: member.name, role: member.role, link, kind });
    return teamOk({ emailed });
  };
}

export function makeSetStaffRole(deps: { directory: StaffDirectory }) {
  return async function setStaffRole(req: {
    actorUid: string;
    uid: string;
    role: string;
  }): Promise<Result<null, TeamError>> {
    if (!isStaffRole(req.role)) return teamErr({ code: "invalid_role" });
    const members = await deps.directory.list();
    const target = members.find((m) => m.uid === req.uid);
    if (!target) return teamErr({ code: "not_found" });
    const problem = checkRoleChange(req.actorUid, target, req.role as StaffRole, members);
    if (problem) return teamErr(problem);
    await deps.directory.setRole(req.uid, req.role as StaffRole);
    return teamOk(null);
  };
}

export function makeSetStaffDisabled(deps: { directory: StaffDirectory }) {
  return async function setStaffDisabled(req: {
    actorUid: string;
    uid: string;
    disabled: boolean;
  }): Promise<Result<null, TeamError>> {
    const members = await deps.directory.list();
    const target = members.find((m) => m.uid === req.uid);
    if (!target) return teamErr({ code: "not_found" });
    const problem = checkDisable(req.actorUid, target, req.disabled, members);
    if (problem) return teamErr(problem);
    await deps.directory.setDisabled(req.uid, req.disabled);
    return teamOk(null);
  };
}

/** Owner deletes another member. The last active owner and the owner themselves can never be deleted. */
export function makeDeleteStaff(deps: { directory: StaffDirectory }) {
  return async function deleteStaff(req: { actorUid: string; uid: string }): Promise<Result<null, TeamError>> {
    const members = await deps.directory.list();
    const target = members.find((m) => m.uid === req.uid);
    if (!target) return teamErr({ code: "not_found" });
    const problem = checkDelete(req.actorUid, target, members);
    if (problem) return teamErr(problem);
    await deps.directory.delete(req.uid);
    return teamOk(null);
  };
}

/** Owner sets a new password for another member (they hand it over themselves). Sessions are revoked. */
export function makeSetStaffPassword(deps: { directory: StaffDirectory }) {
  return async function setStaffPassword(req: { actorUid: string; uid: string; password: string }): Promise<Result<null, TeamError>> {
    if (req.uid === req.actorUid) return teamErr({ code: "self_change" });
    if (!isStrongEnough(req.password)) return teamErr({ code: "weak_password" });
    const target = (await deps.directory.list()).find((m) => m.uid === req.uid);
    if (!target) return teamErr({ code: "not_found" });
    await deps.directory.setPassword(req.uid, req.password);
    return teamOk(null);
  };
}

/** Any member changes their own password after proving they know the current one. */
export function makeChangeOwnPassword(deps: { directory: StaffDirectory; verifier: PasswordVerifier }) {
  return async function changeOwnPassword(req: { uid: string; email: string; current: string; next: string }): Promise<Result<null, TeamError>> {
    if (!isStrongEnough(req.next) || req.next === req.current) return teamErr({ code: "weak_password" });
    const check = await deps.verifier.verify(req.email, req.current);
    if (check === "too_many") return teamErr({ code: "too_many_attempts" });
    if (check !== "ok") return teamErr({ code: "wrong_password" });
    await deps.directory.setPassword(req.uid, req.next);
    return teamOk(null);
  };
}
