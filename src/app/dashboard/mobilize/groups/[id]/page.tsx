import { Suspense } from "react";
import { Skeleton } from "@mui/material";
import GroupDetailClient from "./GroupDetailClient";

export default async function MobilizeGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton height={320} />}>
      <GroupDetailClient groupId={id} />
    </Suspense>
  );
}
