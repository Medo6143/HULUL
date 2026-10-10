import "server-only";
import { FirestoreLeadRepository } from "@/features/leads/infrastructure/firestore-lead.repository";
import { makeSendContactMessage } from "@/features/contact";
import { makeNotificationService, makeSaveRecipients } from "@/features/notifications";
import {
  buildInviteEmail,
  makeInviteStaff,
  makeListStaff,
  makeResendInvite,
  makeSetStaffDisabled,
  makeSetStaffRole,
  type InviteSender,
} from "@/features/team";
import { FirebaseStaffDirectory } from "@/features/team/infrastructure/firebase-staff.directory";
import {
  makeDeleteCaseStudy,
  makeDeleteTestimonial,
  makeGetPublishedCaseStudies,
  makeGetPublishedTestimonials,
  makeListCaseStudies,
  makeListTestimonials,
  makeSaveCaseStudy,
  makeSaveTestimonial,
  makeSetCaseStudyPublished,
  makeSetTestimonialPublished,
} from "@/features/showcase";
import {
  FirestoreCaseStudyStore,
  FirestoreTestimonialStore,
} from "@/features/showcase/infrastructure/firestore-showcase.store";
import { FirestoreNotificationLog } from "@/features/notifications/infrastructure/firestore-notification.log";
import { FirestoreRecipientStore } from "@/features/notifications/infrastructure/firestore-recipient.store";
import { ResendEmailSender } from "@/features/notifications/infrastructure/resend-email.sender";
import { TelegramChatAlerter } from "@/features/notifications/infrastructure/telegram-chat.alerter";
import { FirestoreContactRepository } from "@/features/contact/infrastructure/firestore-contact.repository";
import { makeAddLeadNote, makeChangeLeadStatus, makeCreateLead, makeGetLeadDetail, makeListLeads } from "@/features/leads";
import { serverEnv } from "./env.server";
import { getAdminApp } from "./firebase/admin";
import { createAdminAuth } from "./firebase/auth-admin";
import { signInWithPassword } from "./firebase/auth-rest";
import { createFirestoreRateLimiter } from "./firebase/rate-limit-store";
import { makeRateLimiter } from "./rate-limit";

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

const clock: Clock = {
  now: () => new Date(),
};

const ids: IdGenerator = {
  next: () => crypto.randomUUID(),
};

/** Bump when the privacy policy text changes; stored with every consent record. */
const PDPL_POLICY_VERSION = "draft-1";

async function recipientStore() {
  return new FirestoreRecipientStore(await getAdminApp(), [serverEnv.TEAM_ALERT_EMAIL]);
}

async function notifications() {
  const recipients = await recipientStore();
  return makeNotificationService({
    email: new ResendEmailSender(serverEnv.RESEND_API_KEY, serverEnv.EMAIL_FROM),
    chat: new TelegramChatAlerter(serverEnv.TELEGRAM_BOT_TOKEN, serverEnv.TELEGRAM_CHAT_ID),
    log: new FirestoreNotificationLog(await getAdminApp()),
    teamEmails: () => recipients.list(),
    clock,
  });
}

async function staffDirectory() {
  return new FirebaseStaffDirectory(await getAdminApp());
}

/** Sends the invitation through the notification service, so it is logged like every other email. */
async function inviteSender(): Promise<InviteSender> {
  const service = await notifications();
  return {
    async send(input) {
      const outcome = await service.sendEmail({
        event: "team.invite",
        subjectId: input.uid,
        channel: "email_staff",
        to: input.to,
        message: buildInviteEmail({ name: input.name, link: input.link, role: input.role }),
      });
      return outcome.ok;
    },
  };
}

async function testimonialStore() {
  return new FirestoreTestimonialStore(await getAdminApp());
}

async function caseStudyStore() {
  return new FirestoreCaseStudyStore(await getAdminApp());
}

async function leadRepository() {
  return new FirestoreLeadRepository(await getAdminApp());
}

/**
 * Composition root. This module is the only place that may know both ports and adapters.
 * Use-cases are built on demand so a missing Firebase config only fails the request that needs it.
 */
/**
 * Rate limiter shared across serverless instances through Firestore. If Firestore is not configured or
 * unreachable it falls back to a per-instance memory limiter, so protection never disappears entirely.
 */
function rateLimit(name: string, opts: { limit: number; windowMs: number }) {
  const memory = makeRateLimiter(opts);
  let remote: ((key: string) => Promise<boolean>) | undefined;
  return async (key: string): Promise<boolean> => {
    try {
      remote ??= createFirestoreRateLimiter(await getAdminApp(), { name, ...opts });
      return await remote(key);
    } catch {
      return memory(key);
    }
  };
}

export const container = {
  rateLimit,
  /** Alert recipients (settings page). */
  recipientStore,
  /** Full notification service, for routes that send their own transactional emails. */
  notifications,
  env: serverEnv,
  clock,
  ids,
  async createLead() {
    const repo = await leadRepository();
    return makeCreateLead({ writer: repo, clock, ids, policyVersion: PDPL_POLICY_VERSION, events: await notifications() });
  },
  async sendContactMessage() {
    const repo = new FirestoreContactRepository(await getAdminApp());
    return makeSendContactMessage({
      writer: repo,
      clock,
      ids,
      policyVersion: PDPL_POLICY_VERSION,
      events: await notifications(),
    });
  },
  async listStaff() {
    return makeListStaff({ directory: await staffDirectory() });
  },
  async inviteStaff() {
    return makeInviteStaff({ directory: await staffDirectory(), invites: await inviteSender() });
  },
  async resendInvite() {
    return makeResendInvite({ directory: await staffDirectory(), invites: await inviteSender() });
  },
  async setStaffRole() {
    return makeSetStaffRole({ directory: await staffDirectory() });
  },
  async setStaffDisabled() {
    return makeSetStaffDisabled({ directory: await staffDirectory() });
  },
  async saveRecipients() {
    return makeSaveRecipients({ store: await recipientStore() });
  },
  async listTestimonials() {
    return makeListTestimonials({ store: await testimonialStore() });
  },
  async saveTestimonial() {
    return makeSaveTestimonial({ store: await testimonialStore(), ids, clock });
  },
  async setTestimonialPublished() {
    return makeSetTestimonialPublished({ store: await testimonialStore(), clock });
  },
  async deleteTestimonial() {
    return makeDeleteTestimonial({ store: await testimonialStore() });
  },
  async publishedTestimonials() {
    return makeGetPublishedTestimonials({ store: await testimonialStore() });
  },
  async listCaseStudies() {
    return makeListCaseStudies({ store: await caseStudyStore() });
  },
  async saveCaseStudy() {
    return makeSaveCaseStudy({ store: await caseStudyStore(), clock });
  },
  async setCaseStudyPublished() {
    return makeSetCaseStudyPublished({ store: await caseStudyStore(), clock });
  },
  async deleteCaseStudy() {
    return makeDeleteCaseStudy({ store: await caseStudyStore() });
  },
  async publishedCaseStudies() {
    return makeGetPublishedCaseStudies({ store: await caseStudyStore() });
  },
  async changeLeadStatus() {
    const repo = await leadRepository();
    return makeChangeLeadStatus({ reader: repo, writer: repo, clock });
  },
  async listLeads() {
    return makeListLeads({ reader: await leadRepository() });
  },
  async getLeadDetail() {
    const repo = await leadRepository();
    return makeGetLeadDetail({ reader: repo, history: repo, notes: repo });
  },
  async addLeadNote() {
    const repo = await leadRepository();
    return makeAddLeadNote({ reader: repo, notes: repo, clock, ids });
  },
  /** Staff authentication: password sign-in goes through Firebase Auth REST, sessions through the Admin SDK. */
  async staffAuth() {
    const admin = createAdminAuth(await getAdminApp());
    return {
      ...admin,
      signIn: (email: string, password: string) =>
        signInWithPassword(email, password, serverEnv.NEXT_PUBLIC_FIREBASE_API_KEY),
    };
  },
};

export type Container = typeof container;
