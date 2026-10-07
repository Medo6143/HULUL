import "server-only";
import { FirestoreLeadRepository } from "@/features/leads/infrastructure/firestore-lead.repository";
import { makeSendContactMessage } from "@/features/contact";
import { FirestoreContactRepository } from "@/features/contact/infrastructure/firestore-contact.repository";
import { makeChangeLeadStatus, makeCreateLead } from "@/features/leads";
import { serverEnv } from "./env.server";
import { getAdminApp } from "./firebase/admin";

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
};

export type Container = typeof container;
