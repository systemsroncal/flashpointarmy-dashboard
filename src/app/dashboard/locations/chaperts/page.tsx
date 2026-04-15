import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import ChapertsPageContent from "./ChapertsPageContent";

export default function ChapertsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading" />}>
      <ChapertsPageContent />
    </Suspense>
  );
}
