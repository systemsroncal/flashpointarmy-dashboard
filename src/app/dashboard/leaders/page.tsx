import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import LeadersPageContent from "./LeadersPageContent";

export default function LeadersPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading leaders" />}>
      <LeadersPageContent />
    </Suspense>
  );
}
