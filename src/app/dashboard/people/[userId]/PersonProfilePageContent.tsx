import { PersonProfileClient } from "@/components/dashboard/people/PersonProfileClient";
import {
  loadPersonProfilePage,
  type PersonProfileTab,
} from "@/lib/people/person-profile-data";
import { requireServerUser } from "@/lib/auth/server-session";
import { Paper, Typography } from "@mui/material";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseTab(raw: string | undefined): PersonProfileTab {
  if (raw === "activity" || raw === "communication" || raw === "notes") return raw;
  return "profile";
}

function parseBackHref(from: string | undefined, roleNames: string[]): string {
  if (from === "leaders") return "/dashboard/leaders";
  if (from === "admins") return "/dashboard/admins";
  if (from === "community") return "/dashboard/community";
  if (from === "people") return "/dashboard/people";
  if (roleNames.includes("local_leader")) return "/dashboard/leaders";
  if (roleNames.some((r) => ["admin", "super_admin", "sub_admin"].includes(r))) {
    return "/dashboard/admins";
  }
  return "/dashboard/community";
}

export default async function PersonProfilePageContent({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; from?: string }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(userId)) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">Invalid person id.</Typography>
      </Paper>
    );
  }

  const { supabase, user } = await requireServerUser();
  const result = await loadPersonProfilePage(supabase, user.id, userId);

  if (!result.ok) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">
          {result.status === 404
            ? "Person not found."
            : "Person profiles are available only to administrators."}
        </Typography>
      </Paper>
    );
  }

  return (
    <PersonProfileClient
      person={result.person}
      initialTab={parseTab(sp.tab)}
      backHref={parseBackHref(sp.from, result.person.role_names)}
    />
  );
}
