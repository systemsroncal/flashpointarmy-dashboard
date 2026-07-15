import { Suspense } from "react";
import { Skeleton } from "@mui/material";
import ChapterGroupsClient from "./ChapterGroupsClient";

export default async function ChapterGroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton height={320} />}>
      <ChapterGroupsClient chapterId={id} />
    </Suspense>
  );
}
