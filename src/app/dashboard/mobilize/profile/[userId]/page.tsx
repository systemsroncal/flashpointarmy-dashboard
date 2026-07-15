import { MobilizeMemberProfileClient } from "@/components/mobilize/social/MobilizeMemberProfileClient";
import { requireServerUser } from "@/lib/auth/server-session";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function MobilizeMemberProfilePage({ params, searchParams }: Props) {
  const { userId } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(userId)) {
    redirect("/dashboard/mobilize/my-groups");
  }

  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!canAccessMobilizeModule(roleNames)) {
    redirect("/dashboard");
  }

  const backHref =
    sp.from === "group"
      ? "/dashboard/mobilize/my-groups"
      : sp.from?.startsWith("/")
        ? sp.from
        : "/dashboard/mobilize/my-groups";

  return <MobilizeMemberProfileClient userId={userId} backHref={backHref} />;
}
