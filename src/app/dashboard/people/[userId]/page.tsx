import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { Suspense } from "react";
import PersonProfilePageContent from "./PersonProfilePageContent";

type Props = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; from?: string }>;
};

export default function PersonProfilePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading profile" />}>
      <PersonProfilePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
