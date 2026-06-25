import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import CertificateRequestsPageContent from "./CertificateRequestsPageContent";

export default function CertificateRequestsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading certificate requests" />}>
      <CertificateRequestsPageContent />
    </Suspense>
  );
}
