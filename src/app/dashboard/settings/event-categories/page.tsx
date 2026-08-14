import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EventCategoriesPageContent from "@/app/dashboard/gatherings/categories/EventCategoriesPageContent";

export default function EventCategoriesSettingsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading categories" />}>
      <EventCategoriesPageContent />
    </Suspense>
  );
}
