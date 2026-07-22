import PeoplePageContent from "./PeoplePageContent";
import { canAccessPeopleOverview } from "@/lib/auth/people-section-access";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function PeoplePage() {
  const { supabase, user } = await requireServerUser();
  const [permissions, roles] = await Promise.all([
    loadModulePermissions(supabase, user.id),
    loadUserRoleNames(supabase, user.id),
  ]);

  if (!canAccessPeopleOverview(roles, permissions)) {
    redirect("/dashboard");
  }

  return <PeoplePageContent />;
}
