import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import AdminRolesPageContent from "./AdminRolesPageContent";

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading roles" />}>
      <AdminRolesPageContent />
    </Suspense>
  );
}
