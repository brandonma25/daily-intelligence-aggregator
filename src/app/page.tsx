import LandingHomepage from "@/components/landing/homepage";
import { getDashboardData, getViewerAccount } from "@/lib/data";

export default async function Page() {
  const [data, viewer] = await Promise.all([getDashboardData(), getViewerAccount()]);

  return <LandingHomepage data={data} viewer={viewer} />;
}
