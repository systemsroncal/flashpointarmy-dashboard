import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import LocationsPageContent from "./LocationsPageContent";

export default function LocationsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading locations" />}>
      <LocationsPageContent />
    </Suspense>
  );
}
