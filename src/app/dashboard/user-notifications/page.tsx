import { Suspense } from "react";
import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { UserNotificationsClient } from "@/components/dashboard/user-notifications/UserNotificationsClient";

export default function UserNotificationsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading notifications" />}>
      <UserNotificationsClient />
    </Suspense>
  );
}
