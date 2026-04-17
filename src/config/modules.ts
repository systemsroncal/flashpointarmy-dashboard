/** Module slugs — must match `modules.slug` in Supabase */
export const MODULE_SLUGS = {
  dashboard: "dashboard",
  nationalOverview: "national_overview",
  locations: "locations",
  chaperts: "chaperts",
  chapters: "chapters",
  community: "community",
  gatherings: "gatherings",
  leaders: "leaders",
  /** Dashboard users with administrator / super admin roles (directory + CRUD). */
  admins: "admins",
  training: "training",
  communications: "communications",
  growth: "growth",
  logs: "logs",
  adminRoles: "admin_roles",
  emails: "emails",
} as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[keyof typeof MODULE_SLUGS];
