import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CoachMeetingsPageContent from "./CoachMeetingsPageContent";

export default function CoachMeetingsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading coach meetings" />}>
      <CoachMeetingsPageContent />
    </Suspense>
  );
}
