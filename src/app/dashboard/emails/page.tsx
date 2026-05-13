import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import EmailsPageContent from "./EmailsPageContent";

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; gmail_connected?: string; gmail_error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<DataPaneFallback label="Loading emails" />}>
      <EmailsPageContent
        initialTab={typeof sp.tab === "string" ? sp.tab : undefined}
        gmailConnected={sp.gmail_connected === "1"}
        gmailError={typeof sp.gmail_error === "string" ? sp.gmail_error : undefined}
      />
    </Suspense>
  );
}
