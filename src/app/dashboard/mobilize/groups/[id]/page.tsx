import GroupDetailClient from "./GroupDetailClient";

export default async function MobilizeGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetailClient groupId={id} />;
}
