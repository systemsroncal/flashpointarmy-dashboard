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
  /** Admin course builder, progress reports (admin / super_admin only in DB). */
  courses: "courses",
  communications: "communications",
  growth: "growth",
  logs: "logs",
  adminRoles: "admin_roles",
  emails: "emails",
  /** Nav placeholder; accent color #c32020 in shell. */
  movilization: "movilization",
  /** Analytics & charts (Settings area). */
  reports: "reports",
  /** Donation amount presets (admin / super_admin). */
  donations: "donations",
  /** Donation orders & subscriptions (admin / super_admin). */
  orders: "orders",
  /** Public donate page (all authenticated users). */
  donate: "donate",
} as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[keyof typeof MODULE_SLUGS];
