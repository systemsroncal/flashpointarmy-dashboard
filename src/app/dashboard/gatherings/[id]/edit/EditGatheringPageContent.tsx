import { GatheringForm } from "@/components/dashboard/gatherings/GatheringForm";
import { MODULE_SLUGS } from "@/config/modules";
import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

function toLocalInputDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default async function EditGatheringPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "update")) {
    redirect("/dashboard/gatherings");
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canNotifyAllUsers = isElevatedRole(roleNames);

  const [{ data: chapters }, { data: categories }, { data: ev }] = await Promise.all([
    supabase.from("chapters").select("id, name, state, address_line, city, zip_code").order("name"),
    supabase.from("event_categories").select("id, name, slug").order("sort_order"),
    supabase
      .from("gatherings")
      .select(
        "id, title, subtitle, chapter_id, use_chapter_address, location_manual, starts_at, category_id, description_html, featured_image_url, gallery_image_urls, is_virtual, virtual_url, video_url, cta_url, cta_button_label, cta_button_visible, status, slug, audience_scope"
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!ev) notFound();

  return (
    <GatheringForm
      mode="edit"
      gatheringId={id}
      chapters={chapters ?? []}
      categories={categories ?? []}
      userId={user.id}
      canNotifyAllUsers={canNotifyAllUsers}
      initialValues={{
        title: ev.title ?? "",
        subtitle: ev.subtitle ?? "",
        chapterId: ev.chapter_id ?? "",
        useChapterAddress: Boolean(ev.use_chapter_address),
        locationManual: ev.location_manual ?? "",
        startsAtLocal: toLocalInputDate(ev.starts_at),
        categoryId: ev.category_id ?? "",
        descriptionHtml: ev.description_html ?? "",
        featuredImageUrl: ev.featured_image_url ?? "",
        status: (ev.status as "draft" | "published" | "trash" | null) ?? "draft",
        slug: ev.slug ?? "",
        audienceScope: (ev.audience_scope as "all" | "chapter" | null) ?? "chapter",
        isVirtual: Boolean(ev.is_virtual),
        virtualUrl: ev.virtual_url ?? "",
        galleryImageUrls: (ev.gallery_image_urls as string[] | null) ?? [],
        videoUrl: ev.video_url ?? "",
        ctaUrl: ev.cta_url ?? "",
        ctaButtonLabel: ev.cta_button_label ?? "REGISTER NOW",
        ctaButtonVisible: Boolean(ev.cta_button_visible),
      }}
    />
  );
}
