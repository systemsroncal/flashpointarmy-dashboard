import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import GatheringDetailContent from "./GatheringDetailContent";

export default function GatheringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading event" />}>
      <GatheringDetailContent params={params} />
    </Suspense>
  );
}
