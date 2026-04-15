import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import DashboardHomeContent from "./DashboardHomeContent";

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading overview" />}>
      <DashboardHomeContent />
    </Suspense>
  );
}
