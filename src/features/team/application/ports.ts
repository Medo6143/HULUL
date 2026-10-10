import type { StaffMember, StaffRole } from "../domain/staff";

export interface StaffDirectory {
  list(): Promise<StaffMember[]>;
  findByEmail(email: string): Promise<StaffMember | null>;
  /** Creates the account with a random password nobody sees, and gives it the role. */
  create(input: { email: string; name: string; role: StaffRole }): Promise<StaffMember>;
  setRole(uid: string, role: StaffRole): Promise<void>;
  /** Disabling also revokes the member's sessions. */
  setDisabled(uid: string, disabled: boolean): Promise<void>;
  /** One-time link to set a password. Never logged or returned to the browser. */
  createPasswordSetupLink(email: string): Promise<string>;
}

export interface InviteSender {
  /** Emails the setup link to the invited person. Returns whether it was sent. */
  send(input: { uid: string; to: string; name: string; role: StaffRole; link: string }): Promise<boolean>;
}
