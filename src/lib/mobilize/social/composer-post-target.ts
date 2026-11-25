export type ComposerPostTarget =
  | { type: "profile" }
  | { type: "group"; groupId: string; name: string };

export const PROFILE_POST_TARGET: ComposerPostTarget = { type: "profile" };

export type ComposerGroupOption = {
  id: string;
  name: string;
  is_featured?: boolean;
};

export function sortComposerGroupOptions(groups: ComposerGroupOption[]): ComposerGroupOption[] {
  return [...groups].sort((a, b) => {
    const fa = Boolean(a.is_featured);
    const fb = Boolean(b.is_featured);
    if (fa !== fb) return fa ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function composerPostTargetSelectValue(target: ComposerPostTarget): string {
  return target.type === "profile" ? "profile" : `group:${target.groupId}`;
}

export function parseComposerPostTargetSelectValue(
  value: string,
  groups: ComposerGroupOption[]
): ComposerPostTarget | null {
  if (value === "profile") return PROFILE_POST_TARGET;
  if (!value.startsWith("group:")) return null;
  const groupId = value.slice("group:".length);
  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;
  return { type: "group", groupId: group.id, name: group.name };
}

export function composerPostTargetLabel(target: ComposerPostTarget): string {
  return target.type === "profile" ? "My profile" : target.name;
}