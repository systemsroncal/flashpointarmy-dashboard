import type { SupabaseClient } from "@supabase/supabase-js";
import {
  chunkIdsForInQuery,
  listUserIdsByRoleNames,
} from "@/lib/admin/dashboard-user-queries";

const FOLLOW_INSERT_CHUNK = 200;
const FOLLOWER_LOG_CHUNK = 80;

/** Roles that must auto-follow whitelist targets (sync + eligibility in DB). */
export const MOBILIZE_AUTO_FOLLOW_FOLLOWER_ROLES = [
  "member",
  "local_leader",
  "admin",
  "sub_admin",
  "super_admin",
] as const;

export type AutoFollowSyncEvent = {
  level: "info" | "ok" | "warn" | "error" | "summary";
  message: string;
  summary?: {
    followers: number;
    targets: number;
    created: number;
    alreadyFollowing: number;
    errors: number;
  };
};

export async function applyMobilizeAutoFollowForUser(
  admin: SupabaseClient,
  followerId: string
): Promise<{ created: number; error?: string }> {
  const { data: targets, error: tErr } = await admin
    .from("mobilize_auto_follow_targets")
    .select("user_id");
  if (tErr) return { created: 0, error: tErr.message };

  const followingIds = ((targets ?? []) as { user_id: string }[])
    .map((t) => t.user_id)
    .filter((id) => id !== followerId);
  if (!followingIds.length) return { created: 0 };

  const rows = followingIds.map((following_id) => ({
    follower_id: followerId,
    following_id,
  }));
  const { error } = await admin
    .from("mobilize_user_follows")
    .upsert(rows, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
  if (error) return { created: 0, error: error.message };
  return { created: rows.length };
}

export async function syncMobilizeAutoFollow(
  admin: SupabaseClient,
  onLog: (evt: AutoFollowSyncEvent) => void
): Promise<void> {
  onLog({ level: "info", message: "$ mobilize auto-follow --sync" });
  onLog({ level: "info", message: "Loading whitelist targets…" });

  const { data: targetRows, error: tErr } = await admin
    .from("mobilize_auto_follow_targets")
    .select("user_id");
  if (tErr) {
    onLog({ level: "error", message: `Failed to load targets: ${tErr.message}` });
    return;
  }

  const targetIds = ((targetRows ?? []) as { user_id: string }[]).map((t) => t.user_id);
  if (!targetIds.length) {
    onLog({
      level: "warn",
      message: "No auto-follow targets configured. Add users first.",
    });
    onLog({
      level: "summary",
      message: "Done. Nothing to apply.",
      summary: { followers: 0, targets: 0, created: 0, alreadyFollowing: 0, errors: 0 },
    });
    return;
  }

  const { data: targetUsers } = await admin
    .from("dashboard_users")
    .select("id, email")
    .in("id", targetIds);
  const targetEmailById = new Map(
    ((targetUsers ?? []) as { id: string; email: string }[]).map((u) => [
      u.id,
      String(u.email || u.id),
    ])
  );
  const validTargetIds = targetIds.filter((id) => targetEmailById.has(id));
  onLog({
    level: "info",
    message: `Targets (${validTargetIds.length}): ${validTargetIds
      .map((id) => targetEmailById.get(id) ?? id)
      .join(", ")}`,
  });

  onLog({
    level: "info",
    message: "Resolving members, leaders, and admins…",
  });
  const followerIds = await listUserIdsByRoleNames(admin, [
    ...MOBILIZE_AUTO_FOLLOW_FOLLOWER_ROLES,
  ]);
  onLog({
    level: "info",
    message: `Found ${followerIds.length} member/leader/admin account(s).`,
  });

  if (!followerIds.length) {
    onLog({
      level: "summary",
      message: "Done. No members, leaders, or admins to sync.",
      summary: {
        followers: 0,
        targets: validTargetIds.length,
        created: 0,
        alreadyFollowing: 0,
        errors: 0,
      },
    });
    return;
  }

  let created = 0;
  let alreadyFollowing = 0;
  let errors = 0;
  const batches = chunkIdsForInQuery(followerIds, FOLLOWER_LOG_CHUNK);
  let batchIndex = 0;

  for (const followerBatch of batches) {
    batchIndex += 1;
    onLog({
      level: "info",
      message: `Batch ${batchIndex}/${batches.length} (${followerBatch.length} users)…`,
    });

    const [{ data: userRows }, { data: existingFollows, error: existErr }] = await Promise.all([
      admin.from("dashboard_users").select("id, email").in("id", followerBatch),
      admin
        .from("mobilize_user_follows")
        .select("follower_id, following_id")
        .in("follower_id", followerBatch)
        .in("following_id", validTargetIds),
    ]);

    if (existErr) {
      errors += followerBatch.length;
      onLog({ level: "error", message: `Could not read follows: ${existErr.message}` });
      continue;
    }

    const emailById = new Map(
      ((userRows ?? []) as { id: string; email: string }[]).map((u) => [
        u.id,
        String(u.email || u.id),
      ])
    );
    const existing = new Set(
      ((existingFollows ?? []) as { follower_id: string; following_id: string }[]).map(
        (r) => `${r.follower_id}:${r.following_id}`
      )
    );

    const toInsert: { follower_id: string; following_id: string }[] = [];
    for (const followerId of followerBatch) {
      const email = emailById.get(followerId) ?? followerId;
      let newForUser = 0;
      let alreadyForUser = 0;
      for (const targetId of validTargetIds) {
        if (targetId === followerId) continue;
        if (existing.has(`${followerId}:${targetId}`)) {
          alreadyForUser += 1;
        } else {
          toInsert.push({ follower_id: followerId, following_id: targetId });
          newForUser += 1;
        }
      }
      alreadyFollowing += alreadyForUser;
      if (newForUser === 0) {
        onLog({
          level: "ok",
          message: `${email} already following ${alreadyForUser} target(s)`,
        });
      } else {
        onLog({
          level: "ok",
          message: `${email} → ${newForUser} new follow(s), ${alreadyForUser} existing`,
        });
      }
    }

    for (const part of chunkIdsForInQuery(toInsert, FOLLOW_INSERT_CHUNK)) {
      if (!part.length) continue;
      const { error: insErr } = await admin
        .from("mobilize_user_follows")
        .upsert(part, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
      if (insErr) {
        errors += part.length;
        onLog({ level: "error", message: `Insert failed: ${insErr.message}` });
      } else {
        created += part.length;
      }
    }
  }

  onLog({
    level: "summary",
    message: `Done. ${created} follow(s) created, ${alreadyFollowing} already in place, ${errors} error(s).`,
    summary: {
      followers: followerIds.length,
      targets: validTargetIds.length,
      created,
      alreadyFollowing,
      errors,
    },
  });
}
