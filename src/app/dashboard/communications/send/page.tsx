import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import BroadcastSendPageContent from "./BroadcastSendPageContent";

export default function BroadcastSendPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading send" />}>
      <BroadcastSendPageContent />
    </Suspense>
  );
}
