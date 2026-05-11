import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import ReportsPageContent from "./ReportsPageContent";

export default function ReportsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading reports" />}>
      <ReportsPageContent />
    </Suspense>
  );
}
