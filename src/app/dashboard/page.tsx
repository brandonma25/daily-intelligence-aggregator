import type { Metadata } from "next";

import PersonalizedDashboard from "@/components/dashboard/personalized-dashboard";
import { getDashboardData, getViewerAccount } from "@/lib/data";

export const metadata: Metadata = {
  title: "Today's Briefing — Daily Intelligence",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; allread?: string }>;
}) {
  const [params, data, viewer] = await Promise.all([
    searchParams,
    getDashboardData(),
    getViewerAccount(),
  ]);

  return <PersonalizedDashboard searchParams={params} data={data} viewer={viewer} />;
}
