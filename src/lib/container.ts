import "server-only";
import { FirestoreLeadRepository } from "@/features/leads/infrastructure/firestore-lead.repository";
import { makeSendContactMessage } from "@/features/contact";
import { makeNotificationService, makeSaveRecipients } from "@/features/notifications";
import {
  buildInviteEmail,
  buildPasswordResetEmail,
  makeChangeOwnPassword,
  makeDeleteStaff,
  makeSetStaffPassword,
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
import {
  buildIcs,
  googleCalendarUrl,
  makeCancelBooking,
  makeDeleteException,
  makeGetAvailability,
  makeGetAvailableSlots,
  makeListBookings,
  makeRequestConsultation,
  makeSaveAvailability,
  makeSaveException,
  makeSetBookingStatus,
  renderBookingCancelledAlert,
  renderBookingCancellation,
  renderBookingConfirmation,
  renderBookingTeamAlert,
  type BookingEvents,
  type BookingNotice,
  type CancelTokens,
  type LeadCreator,
} from "@/features/bookings";
import {
  FirestoreAvailabilityStore,
  FirestoreBookingStore,
} from "@/features/bookings/infrastructure/firestore-booking.store";
import { makeGetTemplates, makeSaveTemplates, makeSendInviteEmail } from "@/features/templates";
import { FirestoreTemplateStore } from "@/features/templates/infrastructure/firestore-template.store";
import { FirestoreNotificationLog } from "@/features/notifications/infrastructure/firestore-notification.log";
import { FirestoreRecipientStore } from "@/features/notifications/infrastructure/firestore-recipient.store";
import { ResendEmailSender } from "@/features/notifications/infrastructure/resend-email.sender";
import { TelegramChatAlerter } from "@/features/notifications/infrastructure/telegram-chat.alerter";
import { FirestoreContactRepository } from "@/features/contact/infrastructure/firestore-contact.repository";
import { makeAddLeadNote, makeChangeLeadStatus, makeCreateLead, makeGetLeadDetail, makeListLeads } from "@/features/leads";
import { createHash, randomBytes } from "node:crypto";
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
        message:
          input.kind === "reset"
            ? buildPasswordResetEmail({ name: input.name, link: input.link })
            : buildInviteEmail({ name: input.name, link: input.link, role: input.role }),
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

const cancelTokens: CancelTokens = {
  create() {
    const token = randomBytes(24).toString("base64url");
    return { token, hash: createHash("sha256").update(token).digest("hex") };
  },
  hash: (token) => createHash("sha256").update(token).digest("hex"),
};

async function availabilityStore() {
  return new FirestoreAvailabilityStore(await getAdminApp());
}

async function bookingStore() {
  return new FirestoreBookingStore(await getAdminApp());
}

/** Booking emails: the customer gets a confirmation (or cancellation) with a calendar file, and the team is alerted. */
async function bookingEvents(): Promise<BookingEvents> {
  const service = await notifications();
  const site = serverEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const emailInput = (notice: BookingNotice) => {
    const { booking } = notice;
    return {
      locale: booking.locale,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      startUtc: booking.startUtc,
      meetingLink: notice.meetingLink,
      cancelUrl: `${site}/${booking.locale}/booking/cancel?b=${booking.id}&t=${notice.cancelToken ?? ""}`,
      calendarUrl: googleCalendarUrl({
        start: booking.startUtc,
        end: booking.endUtc,
        title: booking.locale === "ar" ? "استشارة مع حلول تك" : "Consultation with HULOL TECH",
        details: notice.meetingLink,
        location: notice.meetingLink,
      }),
    };
  };

  const ics = (notice: BookingNotice, method: "REQUEST" | "CANCEL") => {
    const { booking } = notice;
    const content = buildIcs({
      uid: `${booking.id}@hulol-tech`,
      method,
      sequence: method === "CANCEL" ? 1 : 0,
      start: booking.startUtc,
      end: booking.endUtc,
      stamp: clock.now(),
      summary: booking.locale === "ar" ? "استشارة مع حلول تك" : "Consultation with HULOL TECH",
      description: notice.meetingLink,
      location: notice.meetingLink,
      attendeeEmail: booking.email || undefined,
      attendeeName: booking.name,
    });
    return [
      {
        filename: "consultation.ics",
        content: Buffer.from(content, "utf8").toString("base64"),
        contentType: `text/calendar; method=${method}; charset=utf-8`,
      },
    ];
  };

  return {
    async created(notice) {
      const input = emailInput(notice);
      const base = { event: "booking.created", subjectId: notice.booking.id } as const;
      await Promise.all([
        service.alertTeamWith(base, renderBookingTeamAlert(input)),
        notice.booking.email
          ? service.sendEmail({
              ...base,
              channel: "email_customer",
              to: notice.booking.email,
              message: renderBookingConfirmation(input),
              attachments: ics(notice, "REQUEST"),
            })
          : Promise.resolve(),
      ]);
    },
    async cancelled(notice) {
      const input = emailInput(notice);
      const base = { event: "booking.cancelled", subjectId: notice.booking.id } as const;
      await Promise.all([
        service.alertTeamWith(base, renderBookingCancelledAlert(input)),
        notice.booking.email
          ? service.sendEmail({
              ...base,
              channel: "email_customer",
              to: notice.booking.email,
              message: renderBookingCancellation(input),
              attachments: ics(notice, "CANCEL"),
            })
          : Promise.resolve(),
      ]);
    },
  };
}

async function templateStore() {
  return new FirestoreTemplateStore(await getAdminApp());
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
  async deleteStaff() {
    return makeDeleteStaff({ directory: await staffDirectory() });
  },
  async setStaffPassword() {
    return makeSetStaffPassword({ directory: await staffDirectory() });
  },
  async changeOwnPassword() {
    return makeChangeOwnPassword({
      directory: await staffDirectory(),
      verifier: {
        async verify(email, password) {
          const result = await signInWithPassword(email, password, serverEnv.NEXT_PUBLIC_FIREBASE_API_KEY);
          if (result.ok) return "ok";
          return result.reason === "too_many_attempts" ? "too_many" : result.reason === "invalid_credentials" ? "wrong" : "failed";
        },
      },
    });
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
  async getAvailableSlots() {
    return makeGetAvailableSlots({ availability: await availabilityStore(), bookings: await bookingStore(), clock });
  },
  async requestConsultation() {
    const createLead = await container.createLead();
    const leads: LeadCreator = {
      async create(request) {
        const result = await createLead(request as Parameters<typeof createLead>[0]);
        return result.ok ? { ok: true, leadId: result.value.leadId } : { ok: false, code: result.error.code };
      },
    };
    return makeRequestConsultation({
      availability: await availabilityStore(),
      bookings: await bookingStore(),
      leads,
      tokens: cancelTokens,
      clock,
      ids,
      events: await bookingEvents(),
    });
  },
  async cancelBooking() {
    return makeCancelBooking({
      availability: await availabilityStore(),
      bookings: await bookingStore(),
      tokens: cancelTokens,
      clock,
      events: await bookingEvents(),
    });
  },
  async listBookings() {
    return makeListBookings({ bookings: await bookingStore() });
  },
  async setBookingStatus() {
    return makeSetBookingStatus({
      availability: await availabilityStore(),
      bookings: await bookingStore(),
      clock,
      events: await bookingEvents(),
    });
  },
  async getAvailability() {
    return makeGetAvailability({ availability: await availabilityStore() });
  },
  async saveAvailability() {
    return makeSaveAvailability({ availability: await availabilityStore() });
  },
  async saveException() {
    return makeSaveException({ availability: await availabilityStore() });
  },
  async deleteException() {
    return makeDeleteException({ availability: await availabilityStore() });
  },
  async getTemplates() {
    return makeGetTemplates({ store: await templateStore() });
  },
  async saveTemplates() {
    return makeSaveTemplates({ store: await templateStore() });
  },
  /** Staff emails a consultation invitation to a lead; the address always comes from the stored lead. */
  async sendInviteEmail() {
    const repo = await leadRepository();
    const service = await notifications();
    return makeSendInviteEmail({
      leads: {
        async find(leadId) {
          const lead = await repo.findById(leadId);
          return lead ? { email: lead.email, name: lead.name } : null;
        },
      },
      mailer: {
        async send({ leadId, to, subject, text, html }) {
          const outcome = await service.sendEmail({
            event: "invite.email",
            subjectId: leadId,
            channel: "email_customer",
            to,
            message: { subject, text, html },
          });
          return outcome.ok;
        },
      },
    });
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
