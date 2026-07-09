import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import JourneyProgressPageContent from "./JourneyProgressPageContent";

export default function JourneyProgressPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading journey progress" />}>
      <JourneyProgressPageContent />
    </Suspense>
  );
}
