import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
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
  const raw = sp.trainingDebug;
  const trainingDebugRequested =
    raw === "1" || raw === "true" || (Array.isArray(raw) && raw.some((v) => v === "1" || v === "true"));

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
