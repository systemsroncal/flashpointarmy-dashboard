import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import UserNotesPageContent from "./UserNotesPageContent";

export default function UserNotesPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading user notes" />}>
      <UserNotesPageContent />
    </Suspense>
  );
}
