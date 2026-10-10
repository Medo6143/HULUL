import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { LeadHistoryReader, LeadNoteStore, LeadReader, LeadWriter } from "../application/ports";
import type { Consent, Lead, StatusHistoryEntry } from "../domain/lead";
import type { LeadNote } from "../domain/note";

type App = Parameters<typeof getFirestore>[0];

const toDoc = (lead: Lead) => {
  const { id, createdAt, updatedAt, ...rest } = lead;
  void id;
  return {
    ...rest,
    firstResponseAt: rest.firstResponseAt ? Timestamp.fromDate(rest.firstResponseAt) : null,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(updatedAt),
  };
};

const fromDoc = (id: string, data: FirebaseFirestore.DocumentData): Lead =>
  ({
    ...data,
    id,
    firstResponseAt: data.firstResponseAt ? (data.firstResponseAt as Timestamp).toDate() : null,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }) as Lead;

export class FirestoreLeadRepository implements LeadReader, LeadWriter, LeadNoteStore, LeadHistoryReader {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async saveNew(lead: Lead, consent: Consent): Promise<void> {
    const batch = this.db.batch();
    batch.set(this.db.collection("leads").doc(lead.id), toDoc(lead));
    batch.set(this.db.collection("consents").doc(), {
      subjectType: "lead",
      subjectId: lead.id,
      kind: consent.kind,
      policyVersion: consent.policyVersion,
      granted: consent.granted,
      ipHash: consent.ipHash,
      grantedAt: Timestamp.fromDate(consent.grantedAt),
    });
    await batch.commit();
  }

  async update(lead: Lead, history: StatusHistoryEntry): Promise<void> {
    const ref = this.db.collection("leads").doc(lead.id);
    const batch = this.db.batch();
    batch.set(ref, toDoc(lead));
    batch.set(ref.collection("statusHistory").doc(), {
      from: history.from,
      to: history.to,
      changedBy: history.changedBy,
      reason: history.reason,
      changedAt: Timestamp.fromDate(history.changedAt),
    });
    await batch.commit();
  }

  async findById(id: string): Promise<Lead | null> {
    const snap = await this.db.collection("leads").doc(id).get();
    return snap.exists ? fromDoc(snap.id, snap.data()!) : null;
  }

  async list(filter?: { status?: Lead["status"] }): Promise<Lead[]> {
    let q: FirebaseFirestore.Query = this.db.collection("leads");
    if (filter?.status) q = q.where("status", "==", filter.status);
    const snap = await q.orderBy("createdAt", "desc").limit(200).get();
    return snap.docs.map((d) => fromDoc(d.id, d.data()));
  }

  async history(leadId: string): Promise<StatusHistoryEntry[]> {
    const snap = await this.db
      .collection("leads")
      .doc(leadId)
      .collection("statusHistory")
      .orderBy("changedAt", "asc")
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        leadId,
        from: data.from,
        to: data.to,
        changedBy: data.changedBy,
        reason: data.reason ?? "",
        changedAt: (data.changedAt as Timestamp).toDate(),
      } as StatusHistoryEntry;
    });
  }

  async addNote(note: LeadNote): Promise<void> {
    await this.db
      .collection("leads")
      .doc(note.leadId)
      .collection("notes")
      .doc(note.id)
      .set({
        authorUid: note.authorUid,
        authorName: note.authorName,
        text: note.text,
        createdAt: Timestamp.fromDate(note.createdAt),
      });
  }

  async listNotes(leadId: string): Promise<LeadNote[]> {
    const snap = await this.db
      .collection("leads")
      .doc(leadId)
      .collection("notes")
      .orderBy("createdAt", "asc")
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        leadId,
        authorUid: data.authorUid,
        authorName: data.authorName,
        text: data.text,
        createdAt: (data.createdAt as Timestamp).toDate(),
      };
    });
  }
}
