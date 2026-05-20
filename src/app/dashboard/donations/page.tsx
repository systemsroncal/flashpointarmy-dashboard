import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import DonationsPageContent from "./DonationsPageContent";

export default function DonationsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading donation settings" />}>
      <DonationsPageContent />
    </Suspense>
  );
}
