import { GroupDetailView } from "@/components/mobilize/GroupDetailView";

type Props = { params: Promise<{ id: string }> };

export default async function MobilizeGroupDetailPage(props: Props) {
  const { id } = await props.params;
  return <GroupDetailView groupId={id} />;
}
