import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import NotificationsPageContent from "./NotificationsPageContent";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading notifications" />}>
      <NotificationsPageContent />
    </Suspense>
  );
}
