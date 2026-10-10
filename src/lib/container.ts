import "server-only";
import { FirestoreLeadRepository } from "@/features/leads/infrastructure/firestore-lead.repository";
import { makeSendContactMessage } from "@/features/contact";
import { FirestoreContactRepository } from "@/features/contact/infrastructure/firestore-contact.repository";
import { makeAddLeadNote, makeChangeLeadStatus, makeCreateLead, makeGetLeadDetail, makeListLeads } from "@/features/leads";
import { serverEnv } from "./env.server";
import { getAdminApp } from "./firebase/admin";
import { createAdminAuth } from "./firebase/auth-admin";
import { signInWithPassword } from "./firebase/auth-rest";

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

async function leadRepository() {
  return new FirestoreLeadRepository(await getAdminApp());
}

/**
 * Composition root. This module is the only place that may know both ports and adapters.
 * Use-cases are built on demand so a missing Firebase config only fails the request that needs it.
 */
export const container = {
  env: serverEnv,
  clock,
  ids,
  async createLead() {
    const repo = await leadRepository();
    return makeCreateLead({ writer: repo, clock, ids, policyVersion: PDPL_POLICY_VERSION });
  },
  async sendContactMessage() {
    const repo = new FirestoreContactRepository(await getAdminApp());
    return makeSendContactMessage({ writer: repo, clock, ids, policyVersion: PDPL_POLICY_VERSION });
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
