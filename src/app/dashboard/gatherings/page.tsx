import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import GatheringsPageContent from "./GatheringsPageContent";

export default function GatheringsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading gatherings" />}>
      <GatheringsPageContent />
    </Suspense>
  );
}
