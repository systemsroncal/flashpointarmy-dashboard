import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import LogsPageContent from "./LogsPageContent";

export default function LogsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading logs" />}>
      <LogsPageContent />
    </Suspense>
  );
}
