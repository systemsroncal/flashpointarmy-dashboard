import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import SessionPageContent from "./SessionPageContent";

export default async function CourseSessionPage({
  params,
}: {
  params: Promise<{ slug: string; sessionSlug: string }>;
}) {
  const { slug, sessionSlug } = await params;
  return (
    <Suspense fallback={<DataPaneFallback label="Loading session" />}>
      <SessionPageContent courseSlug={slug} sessionSlug={sessionSlug} />
    </Suspense>
  );
}
