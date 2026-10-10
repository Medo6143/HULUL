import { randomBytes } from "node:crypto";
import type { App } from "firebase-admin/app";
import { getAuth, type Auth, type UserRecord } from "firebase-admin/auth";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { StaffDirectory } from "../application/ports";
import { isStaffRole, type StaffMember, type StaffRole } from "../domain/staff";

const toMember = (user: UserRecord): StaffMember | null => {
  const role = user.customClaims?.role;
  if (!isStaffRole(role)) return null;
  return {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName || user.email || user.uid,
    role,
    disabled: user.disabled,
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
    lastSignInAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
  };
};

/** Staff are Firebase Auth users carrying the `role` custom claim. `admins/{uid}` mirrors them for the rules. */
export class FirebaseStaffDirectory implements StaffDirectory {
  private readonly auth: Auth;
  private readonly db: Firestore;

  constructor(app: App) {
    this.auth = getAuth(app);
    this.db = getFirestore(app);
  }

  async list(): Promise<StaffMember[]> {
    const members: StaffMember[] = [];
    let pageToken: string | undefined;
    do {
      const page = await this.auth.listUsers(1000, pageToken);
      for (const user of page.users) {
        const member = toMember(user);
        if (member) members.push(member);
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return members;
  }

  async findByEmail(email: string): Promise<StaffMember | null> {
    try {
      const user = await this.auth.getUserByEmail(email);
      return toMember(user) ?? { uid: user.uid, email, name: email, role: "agent", disabled: user.disabled, createdAt: null, lastSignInAt: null };
    } catch (error) {
      if ((error as { code?: string }).code === "auth/user-not-found") return null;
      throw error;
    }
  }

  async create(input: { email: string; name: string; role: StaffRole; password?: string }): Promise<StaffMember> {
    // Default: a random password nobody sees, replaced through the emailed link. An owner may pass a temporary one.
    const user = await this.auth.createUser({
      email: input.email,
      displayName: input.name,
      password: input.password ?? randomBytes(24).toString("base64url"),
      emailVerified: false,
    });
    await this.auth.setCustomUserClaims(user.uid, { role: input.role });
    await this.mirror(user.uid, { email: input.email, role: input.role, disabled: false });
    return {
      uid: user.uid,
      email: input.email,
      name: input.name,
      role: input.role,
      disabled: false,
      createdAt: new Date(),
      lastSignInAt: null,
    };
  }

  async setRole(uid: string, role: StaffRole): Promise<void> {
    await this.auth.setCustomUserClaims(uid, { role });
    // Existing sessions carry the old role until they expire; revoke so the change applies at once.
    await this.auth.revokeRefreshTokens(uid);
    await this.mirror(uid, { role });
  }

  async setDisabled(uid: string, disabled: boolean): Promise<void> {
    await this.auth.updateUser(uid, { disabled });
    if (disabled) await this.auth.revokeRefreshTokens(uid);
    await this.mirror(uid, { disabled });
  }

  createPasswordSetupLink(email: string): Promise<string> {
    return this.auth.generatePasswordResetLink(email);
  }

  private async mirror(uid: string, data: Record<string, unknown>): Promise<void> {
    await this.db
      .collection("admins")
      .doc(uid)
      .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
}
