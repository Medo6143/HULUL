// Pure domain: who is on the team and which changes are allowed.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const STAFF_ROLES = ["owner", "agent"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: StaffRole;
  disabled: boolean;
  createdAt: Date | null;
  lastSignInAt: Date | null;
}

export type TeamError =
  | { code: "invalid_email" }
  | { code: "invalid_role" }
  | { code: "weak_password" }
  | { code: "wrong_password" }
  | { code: "too_many_attempts" }
  | { code: "email_exists" }
  | { code: "last_owner" }
  | { code: "self_change" }
  | { code: "not_found" }
  | { code: "invite_failed" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isStaffRole = (value: unknown): value is StaffRole =>
  typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);

export function normalizeEmail(raw: string): Result<string, TeamError> {
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 200 ? ok(email) : err({ code: "invalid_email" });
}

const activeOwners = (members: StaffMember[]) => members.filter((m) => m.role === "owner" && !m.disabled);

/** Nobody changes their own role or disables themselves, and the team always keeps one active owner. */
export function checkRoleChange(
  actorUid: string,
  target: StaffMember,
  newRole: StaffRole,
  members: StaffMember[],
): TeamError | null {
  if (target.uid === actorUid) return { code: "self_change" };
  if (target.role === "owner" && newRole !== "owner" && !target.disabled && activeOwners(members).length <= 1) {
    return { code: "last_owner" };
  }
  return null;
}

export function checkDisable(
  actorUid: string,
  target: StaffMember,
  disabled: boolean,
  members: StaffMember[],
): TeamError | null {
  if (target.uid === actorUid) return { code: "self_change" };
  if (disabled && target.role === "owner" && !target.disabled && activeOwners(members).length <= 1) {
    return { code: "last_owner" };
  }
  return null;
}

/** Nobody deletes themselves, and the last active owner can never be deleted. */
export function checkDelete(actorUid: string, target: StaffMember, members: StaffMember[]): TeamError | null {
  if (target.uid === actorUid) return { code: "self_change" };
  if (target.role === "owner" && !target.disabled && activeOwners(members).length <= 1) return { code: "last_owner" };
  return null;
}

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

export const isStrongEnough = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;

export { err as teamErr, ok as teamOk };
