import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import BroadcastHistoryPageContent from "./BroadcastHistoryPageContent";

export default function BroadcastHistoryPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading history" />}>
      <BroadcastHistoryPageContent />
    </Suspense>
  );
}
