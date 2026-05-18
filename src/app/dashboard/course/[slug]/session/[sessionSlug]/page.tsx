import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { parseTrainingDebugQueryParam } from "@/lib/training/training-debug";
import { Suspense } from "react";
import SessionPageContent from "./SessionPageContent";

export default async function CourseSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; sessionSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, sessionSlug } = await params;
  const sp = await searchParams;
  const trainingDebugRequested = parseTrainingDebugQueryParam(sp.trainingDebug);

  return (
    <Suspense fallback={<DataPaneFallback label="Loading session" />}>
      <SessionPageContent
        courseSlug={slug}
        sessionSlug={sessionSlug}
        trainingDebugRequested={trainingDebugRequested}
      />
    </Suspense>
  );
}
