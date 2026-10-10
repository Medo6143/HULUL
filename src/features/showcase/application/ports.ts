import type { CaseStudy, Testimonial } from "../domain/showcase";

export interface TestimonialStore {
  list(): Promise<Testimonial[]>;
  get(id: string): Promise<Testimonial | null>;
  save(item: Testimonial): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CaseStudyStore {
  list(): Promise<CaseStudy[]>;
  get(slug: string): Promise<CaseStudy | null>;
  save(item: CaseStudy): Promise<void>;
  delete(slug: string): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
