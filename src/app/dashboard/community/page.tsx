import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CommunityPageContent from "./CommunityPageContent";

export default function CommunityPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading community" />}>
      <CommunityPageContent />
    </Suspense>
  );
}
