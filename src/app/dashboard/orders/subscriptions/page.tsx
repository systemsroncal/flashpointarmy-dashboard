import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import SubscriptionsPageContent from "./SubscriptionsPageContent";

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading subscriptions" />}>
      <SubscriptionsPageContent />
    </Suspense>
  );
}
