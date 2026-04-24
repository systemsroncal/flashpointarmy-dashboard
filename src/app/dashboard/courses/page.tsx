import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CoursesPageContent from "./CoursesPageContent";

export default function CoursesPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading courses" />}>
      <CoursesPageContent />
    </Suspense>
  );
}
