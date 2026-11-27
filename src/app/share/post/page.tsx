import { ShareLinkLanding } from "@/components/share/ShareLinkLanding";
import { buildOpenGraphMetadata } from "@/lib/share/build-share-metadata";
import { legacySharePageRedirectPath } from "@/lib/mobilize/social/post-share-url";
import { firstQueryValue, loadSharePostMeta } from "@/lib/share/load-share-post-meta";
import { mobilizePostShareHeadline } from "@/lib/share/social-share-message";
import { APP_DISPLAY_NAME } from "@/lib/site/app-branding";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const meta = await loadSharePostMeta(sp);
  if (!meta) return {};

  return await buildOpenGraphMetadata({
    title: meta.title,
    description: meta.description,
    imageUrl: meta.imageUrl,
    canonicalPath: "/share/post",
  });
}

export default async function MobilizePostSharePage({ searchParams }: Props) {
  const sp = await searchParams;
  const meta = await loadSharePostMeta(sp);
  if (!meta) notFound();

  const redirectTarget = legacySharePageRedirectPath({
    kind: firstQueryValue(sp.kind),
    group_id: firstQueryValue(sp.group_id),
    user_id: firstQueryValue(sp.user_id),
    post_id: firstQueryValue(sp.post_id),
  });

  if (!redirectTarget) notFound();

  const authorName = ("authorName" in meta && meta.authorName) || "Member";
  const headline = mobilizePostShareHeadline(authorName);

  return (
    <ShareLinkLanding
      headline={headline}
      subtitle={meta.title}
      body={`Posts on ${APP_DISPLAY_NAME} require sign-in to comment and react.`}
      redirectPath={redirectTarget}
    />
  );
}