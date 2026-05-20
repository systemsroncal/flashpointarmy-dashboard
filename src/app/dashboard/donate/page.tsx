import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import DonatePageContent from "./DonatePageContent";

export default function DonatePage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading donate" />}>
      <DonatePageContent />
    </Suspense>
  );
}
