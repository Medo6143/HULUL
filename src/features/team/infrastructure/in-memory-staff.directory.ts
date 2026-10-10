import type { StaffDirectory } from "../application/ports";
import type { StaffMember, StaffRole } from "../domain/staff";

export class InMemoryStaffDirectory implements StaffDirectory {
  readonly members = new Map<string, StaffMember>();
  readonly links: string[] = [];
  private counter = 0;

  seed(member: Partial<StaffMember> & { uid: string; email: string }): void {
    this.members.set(member.uid, {
      name: member.email,
      role: "agent",
      disabled: false,
      createdAt: null,
      lastSignInAt: null,
      ...member,
    });
  }

  async list(): Promise<StaffMember[]> {
    return [...this.members.values()];
  }

  async findByEmail(email: string): Promise<StaffMember | null> {
    return [...this.members.values()].find((m) => m.email === email) ?? null;
  }

  async create(input: { email: string; name: string; role: StaffRole; password?: string }): Promise<StaffMember> {
    const uid = `u${++this.counter}`;
    const member: StaffMember = { uid, email: input.email, name: input.name, role: input.role, disabled: false, createdAt: new Date(0), lastSignInAt: null };
    this.members.set(uid, member);
    return member;
  }

  async setRole(uid: string, role: StaffRole): Promise<void> {
    const m = this.members.get(uid);
    if (m) this.members.set(uid, { ...m, role });
  }

  async setDisabled(uid: string, disabled: boolean): Promise<void> {
    const m = this.members.get(uid);
    if (m) this.members.set(uid, { ...m, disabled });
  }

  readonly passwords = new Map<string, string>();

  async delete(uid: string): Promise<void> {
    this.members.delete(uid);
    this.passwords.delete(uid);
  }

  async setPassword(uid: string, password: string): Promise<void> {
    if (this.members.has(uid)) this.passwords.set(uid, password);
  }

  async createPasswordSetupLink(email: string): Promise<string> {
    const link = `https://example.test/reset?e=${encodeURIComponent(email)}`;
    this.links.push(link);
    return link;
  }
}
