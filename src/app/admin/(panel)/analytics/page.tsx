import { loadAnalytics } from "@/app/admin/_lib/data";
import { AnalyticsView } from "@/features/admin";

export default async function AdminAnalyticsPage() {
  return <AnalyticsView data={await loadAnalytics()} />;
}
