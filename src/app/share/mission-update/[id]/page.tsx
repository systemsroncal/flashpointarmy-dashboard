import { ShareLinkLanding } from "@/components/share/ShareLinkLanding";
import { buildOpenGraphMetadata, descriptionFromAnnouncementHtml } from "@/lib/share/build-share-metadata";
import { extractImageSrcsFromHtml } from "@/lib/share/announcement-media-html";
import { buildMissionUpdateSharePath } from "@/lib/dashboard/mission-update-share-url";
import { missionUpdateShareHeadline } from "@/lib/share/social-share-message";
import { APP_DISPLAY_NAME, DEFAULT_SHARE_META_IMAGE } from "@/lib/site/app-branding";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

async function fetchAnnouncement(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("dashboard_announcements")
    .select("id, title, description")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await fetchAnnouncement(id);
  if (!row?.title) return {};

  const images = extractImageSrcsFromHtml(row.description ?? "");
  return buildOpenGraphMetadata({
    title: row.title,
    description: descriptionFromAnnouncementHtml(row.description ?? ""),
    imageUrl: images[0] ?? DEFAULT_SHARE_META_IMAGE,
    canonicalPath: `/share/mission-update/${id}`,
  });
}

export default async function MissionUpdateSharePage({ params }: Props) {
  const { id } = await params;
  const row = await fetchAnnouncement(id);
  if (!row) notFound();

  const redirectPath = buildMissionUpdateSharePath(id);
  const headline = missionUpdateShareHeadline(row.title);

  return (
    <ShareLinkLanding
      headline={headline}
      subtitle={row.title}
      body={`Mission Updates on ${APP_DISPLAY_NAME} require a free member sign-in.`}
      redirectPath={redirectPath}
    />
  );
}