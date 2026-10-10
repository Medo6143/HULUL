import type { App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { CaseStudyStore, TestimonialStore } from "../application/ports";
import type { CaseStudy, Testimonial } from "../domain/showcase";

/** Documents are stored exactly as the domain objects (dates as ISO strings), keyed by id or slug. */
class FirestoreCollection<T extends object> {
  protected readonly db: Firestore;

  constructor(
    app: App,
    private readonly name: string,
    private readonly keyOf: (item: T) => string,
  ) {
    this.db = getFirestore(app);
  }

  async list(): Promise<T[]> {
    const snap = await this.db.collection(this.name).get();
    return snap.docs.map((doc) => doc.data() as T);
  }

  async get(key: string): Promise<T | null> {
    const snap = await this.db.collection(this.name).doc(key).get();
    return snap.exists ? (snap.data() as T) : null;
  }

  async save(item: T): Promise<void> {
    await this.db.collection(this.name).doc(this.keyOf(item)).set(item);
  }

  async delete(key: string): Promise<void> {
    await this.db.collection(this.name).doc(key).delete();
  }
}

export class FirestoreTestimonialStore extends FirestoreCollection<Testimonial> implements TestimonialStore {
  constructor(app: App) {
    super(app, "testimonials", (item) => item.id);
  }
}

export class FirestoreCaseStudyStore extends FirestoreCollection<CaseStudy> implements CaseStudyStore {
  constructor(app: App) {
    super(app, "caseStudies", (item) => item.slug);
  }
}
