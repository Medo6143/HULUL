// Real case studies only, each with the client's permission and a measurable result.
// Empty until the content arrives (see MISSING_CONTENT.md). The home section stays hidden while this is empty.
export interface CaseStudy {
  slug: string;
  category: "web" | "mobile" | "design";
  title: { ar: string; en: string };
  result: { ar: string; en: string };
}

export const caseStudies: readonly CaseStudy[] = [];
