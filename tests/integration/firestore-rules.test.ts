import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, describe, it } from "vitest";

// Runs against the Firestore emulator: `npm run test:rules`. Skipped when no emulator is running.
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const [host, port] = (emulator ?? "127.0.0.1:8080").split(":");

describe.skipIf(!emulator)("firestore rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "hulol-rules-test",
      firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
    });
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc("leads/l1").set({ name: "Lead" });
      await db.doc("leads/l1/notes/n1").set({ text: "note" });
      await db.doc("leads/l1/statusHistory/h1").set({ to: "contacted" });
      await db.doc("contactMessages/m1").set({ message: "hi" });
      await db.doc("consents/c1").set({ kind: "pdpl_form" });
      await db.doc("notificationLogs/x1").set({ status: "sent" });
      await db.doc("rateLimits/r1").set({ count: 1 });
      await db.doc("settings/notifications").set({ recipients: ["a@example.com"] });
      await db.doc("bookings/b1").set({ name: "Customer" });
      await db.doc("bookingSlots/123").set({ bookingId: "b1" });
      await db.doc("availabilityExceptions/2026-10-12").set({ closed: true });
      await db.doc("settings/availability").set({ slotMinutes: 30 });
      await db.doc("admins/agent1").set({ role: "agent" });
      await db.doc("admins/owner1").set({ role: "owner" });
      await db.doc("caseStudies/published").set({ published: true, consentToPublish: true });
      await db.doc("caseStudies/draft").set({ published: false });
      await db.doc("caseStudies/no-consent").set({ published: true, consentToPublish: false });
      await db.doc("testimonials/ok").set({ published: true, consentToPublish: true });
      await db.doc("testimonials/no-consent").set({ published: true, consentToPublish: false });
      await db.doc("settings/site").set({ name: "site" });
      await db.doc("clients/client1").set({ name: "Client" });
      await db.doc("proposals/p1").set({ clientId: "client1" });
      await db.doc("proposals/p2").set({ clientId: "someone-else" });
    });
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  const anon = () => env.unauthenticatedContext().firestore();
  const agent = () => env.authenticatedContext("agent1", { role: "agent" }).firestore();
  const owner = () => env.authenticatedContext("owner1", { role: "owner" }).firestore();
  const client = () => env.authenticatedContext("client1").firestore();

  describe("visitors", () => {
    it("cannot read any private collection", async () => {
      for (const path of [
        "leads/l1",
        "leads/l1/notes/n1",
        "leads/l1/statusHistory/h1",
        "contactMessages/m1",
        "consents/c1",
        "notificationLogs/x1",
        "rateLimits/r1",
        "admins/agent1",
      ]) {
        await assertFails(anon().doc(path).get());
      }
    });
    it("cannot write anything, including creating a lead from the browser", async () => {
      await assertFails(anon().doc("leads/new").set({ name: "x" }));
      await assertFails(anon().doc("contactMessages/new").set({ message: "x" }));
      await assertFails(anon().doc("settings/site").set({ name: "hacked" }));
    });
    it("can read published content and site settings only", async () => {
      await assertSucceeds(anon().doc("caseStudies/published").get());
      await assertFails(anon().doc("caseStudies/draft").get());
      await assertFails(anon().doc("caseStudies/no-consent").get());
      await assertSucceeds(anon().doc("testimonials/ok").get());
      await assertFails(anon().doc("testimonials/no-consent").get());
      await assertSucceeds(anon().doc("settings/site").get());
    });
    it("is denied everything outside the known collections", async () => {
      await assertFails(anon().doc("random/doc").get());
      await assertFails(anon().doc("random/doc").set({ a: 1 }));
    });
  });

  describe("staff", () => {
    it("agents and owners read leads, notes, history, messages, consents, and logs", async () => {
      for (const db of [agent(), owner()]) {
        for (const path of [
          "leads/l1",
          "leads/l1/notes/n1",
          "leads/l1/statusHistory/h1",
          "contactMessages/m1",
          "consents/c1",
          "notificationLogs/x1",
        ]) {
          await assertSucceeds(db.doc(path).get());
        }
      }
    });
    it("staff still cannot write from the browser, and cannot read rate limit counters", async () => {
      await assertFails(agent().doc("leads/l1").update({ status: "won" }));
      await assertFails(owner().doc("leads/l1/notes/n2").set({ text: "x" }));
      await assertFails(owner().doc("rateLimits/r1").get());
    });
    it("only the owner reads the alert recipients, and nobody writes them from the browser", async () => {
      await assertSucceeds(owner().doc("settings/notifications").get());
      await assertFails(agent().doc("settings/notifications").get());
      await assertFails(anon().doc("settings/notifications").get());
      await assertFails(owner().doc("settings/notifications").set({ recipients: [] }));
    });
    it("staff read bookings and availability, nobody reads slot locks or writes any of it", async () => {
      for (const db of [agent(), owner()]) {
        await assertSucceeds(db.doc("bookings/b1").get());
        await assertSucceeds(db.doc("availabilityExceptions/2026-10-12").get());
        await assertSucceeds(db.doc("settings/availability").get());
        await assertFails(db.doc("bookingSlots/123").get());
        await assertFails(db.doc("bookings/b1").update({ status: "cancelled" }));
        await assertFails(db.doc("settings/availability").set({ slotMinutes: 5 }));
      }
      for (const path of ["bookings/b1", "bookingSlots/123", "availabilityExceptions/2026-10-12", "settings/availability"]) {
        await assertFails(anon().doc(path).get());
        await assertFails(client().doc(path).get());
      }
      await assertFails(anon().doc("bookingSlots/999").set({ bookingId: "x" }));
    });
    it("an agent reads only their own admin record, the owner reads any", async () => {
      await assertSucceeds(agent().doc("admins/agent1").get());
      await assertFails(agent().doc("admins/owner1").get());
      await assertSucceeds(owner().doc("admins/agent1").get());
    });
  });

  describe("signed-in clients without a staff role", () => {
    it("cannot read leads or messages", async () => {
      await assertFails(client().doc("leads/l1").get());
      await assertFails(client().doc("contactMessages/m1").get());
    });
    it("read only their own client record and proposals", async () => {
      await assertSucceeds(client().doc("clients/client1").get());
      await assertSucceeds(client().doc("proposals/p1").get());
      await assertFails(client().doc("proposals/p2").get());
    });
  });
});
