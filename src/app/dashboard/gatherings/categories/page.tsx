import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EventCategoriesPageContent from "./EventCategoriesPageContent";

export default function EventCategoriesPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading categories" />}>
      <EventCategoriesPageContent />
    </Suspense>
  );
}
