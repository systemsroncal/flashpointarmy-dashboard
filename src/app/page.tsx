import { getServerAuth } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function Home() {
  const { user, staleSessionCleared } = await getServerAuth();
  if (user) {
    redirect("/dashboard");
  }
  redirect(staleSessionCleared ? "/login?reason=session_expired" : "/login");
}
