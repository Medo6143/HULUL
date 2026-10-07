// Only entries with the client's written consent to publish name and quote (design system invariant 7).
// Empty until consent is received. The home section stays hidden while this is empty.
export interface Testimonial {
  id: string;
  quote: { ar: string; en: string };
  name: { ar: string; en: string };
  role: { ar: string; en: string };
}

export const testimonials: readonly Testimonial[] = [];
