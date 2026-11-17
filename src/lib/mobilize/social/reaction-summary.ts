export type ReactionType = "like" | "love";

export type ReactionCounts = {
  like: number;
  love: number;
  total: number;
};

export type ReactionState = ReactionCounts & { viewer_reaction: ReactionType | null };

export function applyReactionToggle(
  current: ReactionState,
  next: ReactionType | null
): ReactionState {
  const prev = current.viewer_reaction;
  let like = current.like;
  let love = current.love;
  if (prev === "like") like = Math.max(0, like - 1);
  if (prev === "love") love = Math.max(0, love - 1);
  if (next === "like") like += 1;
  if (next === "love") love += 1;
  return { like, love, total: like + love, viewer_reaction: next };
}

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
