export type ReactionType = "like" | "love";

export type ReactionCounts = {
  like: number;
  love: number;
  total: number;
};

export function summarizeReactions(
  rows: { reaction_type: string }[],
  viewerReaction: ReactionType | null
): ReactionCounts & { viewer_reaction: ReactionType | null } {
  let like = 0;
  let love = 0;
  for (const r of rows) {
    if (r.reaction_type === "love") love += 1;
    else if (r.reaction_type === "like") like += 1;
  }
  return { like, love, total: like + love, viewer_reaction: viewerReaction };
}
