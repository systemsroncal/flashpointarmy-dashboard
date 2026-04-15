import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EmailsPageContent from "./EmailsPageContent";

export default function EmailsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading emails" />}>
      <EmailsPageContent />
    </Suspense>
  );
}
