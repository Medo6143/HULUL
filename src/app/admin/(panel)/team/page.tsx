import { loadTeam } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { TeamView } from "@/features/admin";

export default async function AdminTeamPage() {
  const owner = await requireOwner();
  const { members, demo } = await loadTeam();
  return <TeamView members={members} currentUid={owner.uid} demo={demo} />;
}
