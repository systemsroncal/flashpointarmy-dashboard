import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import TrainingPageContent from "./TrainingPageContent";

export default function TrainingPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading training" />}>
      <TrainingPageContent />
    </Suspense>
  );
}
