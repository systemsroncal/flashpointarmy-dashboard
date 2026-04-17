import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import AdminsPageContent from "./AdminsPageContent";

export default function AdminsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading administrators" />}>
      <AdminsPageContent />
    </Suspense>
  );
}
