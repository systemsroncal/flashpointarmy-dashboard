/** Platform owner account — role must always remain `super_admin` and is not editable in Admins UI/API. */
export const PROTECTED_SUPER_ADMIN_USER_ID = "357049d0-cda2-4d5f-ad36-4900fda1323b";

export function isProtectedSuperAdminUserId(userId: string | null | undefined): boolean {
  return Boolean(userId && userId === PROTECTED_SUPER_ADMIN_USER_ID);
}
