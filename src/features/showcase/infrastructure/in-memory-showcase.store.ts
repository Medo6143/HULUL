import type { CaseStudyStore, TestimonialStore } from "../application/ports";
import type { CaseStudy, Testimonial } from "../domain/showcase";

class MemoryCollection<T> {
  private readonly items = new Map<string, T>();
  constructor(private readonly keyOf: (item: T) => string) {}
  async list() {
    return [...this.items.values()];
  }
  async get(key: string) {
    return this.items.get(key) ?? null;
  }
  async save(item: T) {
    this.items.set(this.keyOf(item), item);
  }
  async delete(key: string) {
    this.items.delete(key);
  }
}

export class InMemoryTestimonialStore extends MemoryCollection<Testimonial> implements TestimonialStore {
  constructor() {
    super((item) => item.id);
  }
}

export class InMemoryCaseStudyStore extends MemoryCollection<CaseStudy> implements CaseStudyStore {
  constructor() {
    super((item) => item.slug);
  }
}
