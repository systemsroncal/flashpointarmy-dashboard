import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import BroadcastTemplatesPageContent from "./BroadcastTemplatesPageContent";

export default function BroadcastTemplatesPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading templates" />}>
      <BroadcastTemplatesPageContent />
    </Suspense>
  );
}
