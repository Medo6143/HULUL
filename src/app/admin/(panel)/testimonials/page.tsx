import { loadTestimonials } from "@/app/admin/_lib/data";
import { requireStaff } from "@/app/admin/_lib/staff";
import { TestimonialsView } from "@/features/admin";

export default async function AdminTestimonialsPage() {
  await requireStaff();
  const { items, demo } = await loadTestimonials();
  return <TestimonialsView items={items} demo={demo} />;
}
