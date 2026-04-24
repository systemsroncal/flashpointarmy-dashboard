/** Select option for course author (dashboard user). Safe for Server Components. */
export type AuthorOption = { id: string; label: string };

export type AuthorLabelRow = {
  id?: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export function labelForAuthor(row: AuthorLabelRow): string {
  const dn = row.display_name?.trim();
  if (dn) return dn;
  const n = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  if (n) return `${n} (${row.email})`;
  return row.email ?? row.id ?? "User";
}
