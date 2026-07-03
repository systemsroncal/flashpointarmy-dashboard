export type MissionRankAudience = "local_leader" | "member";

/** Inputs used to derive the displayed mission rank from onboarding progress. */
export type MissionRankProgress = {
  training: "pending" | "in_progress" | "completed";
  coachMeeting: "locked" | "pending" | "in_progress" | "completed";
  firstMission: "locked" | "pending" | "in_progress" | "completed";
  rankAudience: MissionRankAudience;
};

export type MissionRankTier = {
  title: string;
  unlock?: string;
  description: string;
};

export const LEADER_MISSION_RANKS: MissionRankTier[] = [
  {
    title: "Recruit",
    description:
      "You have answered the call and begun your training. Complete Biblical Citizenship to prepare for your first mission.",
  },
  {
    title: "Leader Certified",
    unlock: "Complete Mission Briefing & Lead a Chapter.",
    description:
      "You are gathering and equipping believers in your community to make a lasting impact.",
  },
  {
    title: "Chapter Leader",
    unlock: "Lead multiple active chapters or mentor leaders.",
    description:
      "You are multiplying leadership and strengthening the movement across your region.",
  },
  {
    title: "Force Multiplier",
    unlock: "Successfully mentor other leaders and help launch additional chapters.",
    description:
      "You are multiplying the mission by developing new leaders and expanding the reach of FlashPoint Army Chapters.",
  },
];

export const MEMBER_MISSION_RANKS: MissionRankTier[] = [
  {
    title: "Recruit",
    description:
      "You have answered the call and begun your training. Complete Biblical Citizenship to prepare for your first mission.",
  },
  {
    title: "Biblical Citizen",
    unlock: "Complete Biblical Citizenship.",
    description:
      "You are equipped with the foundational training and ready to begin serving your community.",
  },
  {
    title: "Mission Partner",
    unlock: "Complete your first mission.",
    description:
      "You have moved from preparation to action by actively supporting one of the 12 missions.",
  },
];

export function missionRanksForAudience(audience: MissionRankAudience): MissionRankTier[] {
  return audience === "local_leader" ? LEADER_MISSION_RANKS : MEMBER_MISSION_RANKS;
}

export function missionRankDialogTitle(audience: MissionRankAudience): string {
  return audience === "local_leader" ? "Leader mission ranks" : "Member mission ranks";
}

/** Current mission rank title from onboarding progress (Recruit → …). */
export function resolveCurrentMissionRank(snapshot: MissionRankProgress): MissionRankTier {
  const ranks = missionRanksForAudience(snapshot.rankAudience);

  if (snapshot.rankAudience === "local_leader") {
    if (snapshot.firstMission === "completed") {
      return ranks[2] ?? ranks[ranks.length - 1];
    }
    if (snapshot.coachMeeting === "completed") {
      return ranks[1] ?? ranks[0];
    }
    return ranks[0];
  }

  if (snapshot.firstMission === "completed") {
    return ranks[2] ?? ranks[ranks.length - 1];
  }
  if (snapshot.training === "completed") {
    return ranks[1] ?? ranks[0];
  }
  return ranks[0];
}

export function resolveCurrentMissionRankLabel(snapshot: MissionRankProgress): string {
  return resolveCurrentMissionRank(snapshot).title;
}
