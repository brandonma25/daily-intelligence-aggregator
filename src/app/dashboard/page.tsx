import type { Metadata } from "next";

import PersonalizedDashboard from "@/components/dashboard/personalized-dashboard";
import { getDashboardFixture } from "@/lib/dashboard-test-fixtures";
import { getDashboardPageState } from "@/lib/data";

export const metadata: Metadata = {
  title: "Today's Briefing — Daily Intelligence",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; allread?: string; fixture?: string }>;
}) {
  const params = await searchParams;
  const fixture =
    process.env.NODE_ENV === "test" && params.fixture
      ? getDashboardFixture(params.fixture)
      : null;

  const pageState = fixture
    ? { data: fixture, viewer: null }
    : await getDashboardPageState("/dashboard");

  return (
    <PersonalizedDashboard
      searchParams={params}
      data={pageState.data}
      viewer={pageState.viewer}
    />
  );
}
