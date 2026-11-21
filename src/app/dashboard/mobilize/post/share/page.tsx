import { SharedPostPageClient } from "./SharedPostPageClient";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MobilizeSharedPostPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") q.set(key, value);
  }
  const qs = q.toString();
  const returnPath = qs
    ? `/dashboard/mobilize/post/share?${qs}`
    : "/dashboard/mobilize/post/share";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const { data: du } = await supabase
    .from("dashboard_users")
    .select("first_name, last_name, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

  const displayName =
    [du?.first_name, du?.last_name].filter(Boolean).join(" ").trim() ||
    du?.display_name?.trim() ||
    null;

  return (
    <SharedPostPageClient
      viewerUserId={user.id}
      viewerDisplayName={displayName}
      viewerAvatarUrl={(profile?.avatar_url as string | null) ?? null}
    />
  );
}