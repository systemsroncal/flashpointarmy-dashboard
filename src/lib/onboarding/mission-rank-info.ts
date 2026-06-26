export type MissionRankAudience = "local_leader" | "member";

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
    unlock: "Complete Coaching Meeting & Lead a Chapter.",
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
