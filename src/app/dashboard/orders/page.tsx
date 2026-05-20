import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import OrdersPageContent from "./OrdersPageContent";

export default function OrdersPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading orders" />}>
      <OrdersPageContent />
    </Suspense>
  );
}
