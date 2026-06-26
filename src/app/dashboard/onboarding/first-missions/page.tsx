import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import FirstMissionsPageContent from "./FirstMissionsPageContent";

export default function FirstMissionsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading first mission" />}>
      <FirstMissionsPageContent />
    </Suspense>
  );
}
