import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EditGatheringPageContent from "./EditGatheringPageContent";

export default function EditGatheringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading event form" />}>
      <EditGatheringPageContent params={params} />
    </Suspense>
  );
}
