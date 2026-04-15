import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import NewGatheringPageContent from "./NewGatheringPageContent";

export default function NewGatheringPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading form" />}>
      <NewGatheringPageContent />
    </Suspense>
  );
}
