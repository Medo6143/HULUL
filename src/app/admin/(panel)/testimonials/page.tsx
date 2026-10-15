import { loadCaseStudies, loadTestimonials } from "@/app/admin/_lib/data";
import { requireStaff } from "@/app/admin/_lib/staff";
import { TestimonialsView } from "@/features/admin";

export default async function AdminTestimonialsPage() {
  await requireStaff();
  const [{ items, demo }, projects] = await Promise.all([loadTestimonials(), loadCaseStudies()]);
  return (
    <TestimonialsView
      items={items}
      projects={projects.items.map((p) => ({ slug: p.slug, title: p.title.ar }))}
      demo={demo}
    />
  );
}
