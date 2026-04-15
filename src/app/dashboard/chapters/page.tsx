import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import ChaptersPageContent from "./ChaptersPageContent";

export default function ChaptersPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading chapters" />}>
      <ChaptersPageContent />
    </Suspense>
  );
}
