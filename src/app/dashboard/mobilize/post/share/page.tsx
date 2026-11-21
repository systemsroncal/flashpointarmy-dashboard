import { legacySharePageRedirectPath } from "@/lib/mobilize/social/post-share-url";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function MobilizeLegacySharedPostRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const target = legacySharePageRedirectPath({
    kind: firstString(sp.kind),
    group_id: firstString(sp.group_id),
    user_id: firstString(sp.user_id),
    post_id: firstString(sp.post_id),
  });

  if (!target) {
    redirect("/dashboard/mobilize/home");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }

  redirect(target);
}