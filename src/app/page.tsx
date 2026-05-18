import { getAuthUser } from "@/utils/supabase/get-auth-user";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { user, staleSessionCleared } = await getAuthUser(supabase);
  if (user) {
    redirect("/dashboard");
  }
  redirect(staleSessionCleared ? "/login?reason=session_expired" : "/login");
}
