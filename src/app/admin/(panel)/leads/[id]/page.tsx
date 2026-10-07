import { notFound } from "next/navigation";
import { LeadDetail, findDemoLead } from "@/features/admin";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = findDemoLead(id);
  if (!lead) notFound();
  return <LeadDetail lead={lead} />;
}
