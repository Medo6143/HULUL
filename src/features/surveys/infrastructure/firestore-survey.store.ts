import type { App } from "firebase-admin/app";
import { Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { SurveyStore } from "../application/usecases";
import type { Survey, SurveyResponse } from "../domain/survey";

const toDoc = (survey: Survey) => {
  const { id, createdAt, response, ...rest } = survey;
  void id;
  return {
    ...rest,
    createdAt: Timestamp.fromDate(createdAt),
    response: response ? { ...response, answeredAt: Timestamp.fromDate(response.answeredAt) } : null,
  };
};

const fromDoc = (id: string, data: FirebaseFirestore.DocumentData): Survey => {
  const response = data.response
    ? ({ ...data.response, answeredAt: (data.response.answeredAt as Timestamp).toDate() } as SurveyResponse)
    : null;
  return { ...data, id, createdAt: (data.createdAt as Timestamp).toDate(), response, testimonialId: data.testimonialId ?? "" } as Survey;
};

/** `surveys/{id}`. Only the server reads and writes them; staff can read them through the rules. */
export class FirestoreSurveyStore implements SurveyStore {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async list(): Promise<Survey[]> {
    const snap = await this.db.collection("surveys").orderBy("createdAt", "desc").limit(300).get();
    return snap.docs.map((doc) => fromDoc(doc.id, doc.data()));
  }

  async get(id: string): Promise<Survey | null> {
    const snap = await this.db.collection("surveys").doc(id).get();
    return snap.exists ? fromDoc(snap.id, snap.data()!) : null;
  }

  async findByToken(token: string): Promise<Survey | null> {
    const snap = await this.db.collection("surveys").where("token", "==", token).limit(1).get();
    const doc = snap.docs[0];
    return doc ? fromDoc(doc.id, doc.data()) : null;
  }

  async save(survey: Survey): Promise<void> {
    await this.db.collection("surveys").doc(survey.id).set(toDoc(survey));
  }

  async delete(id: string): Promise<void> {
    await this.db.collection("surveys").doc(id).delete();
  }
}
