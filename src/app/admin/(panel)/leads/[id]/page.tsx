import { notFound } from "next/navigation";
import { leadWhatsappHref, loadInviteCard, loadLeadDetail } from "@/app/admin/_lib/data";
import { LeadDetail } from "@/features/admin";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await loadLeadDetail(id);
  if (!found) notFound();
  const invite = await loadInviteCard(found.lead.service, found.demo);
  return (
    <LeadDetail
      lead={found.lead}
      demo={found.demo}
      whatsappHref={leadWhatsappHref(found.lead.phone, found.demo)}
      invite={invite}
    />
  );
}
