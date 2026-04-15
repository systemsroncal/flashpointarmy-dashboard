export type CrudKey = "create" | "read" | "update" | "delete";

export type CrudFlags = Record<CrudKey, boolean>;

export type ModulePermissionMap = Record<string, CrudFlags>;

export function emptyCrud(): CrudFlags {
  return { create: false, read: false, update: false, delete: false };
}

export function mergeCrud(a: CrudFlags, b: CrudFlags): CrudFlags {
  return {
    create: a.create || b.create,
    read: a.read || b.read,
    update: a.update || b.update,
    delete: a.delete || b.delete,
  };
}

export function can(
  permissions: ModulePermissionMap,
  moduleSlug: string,
  op: CrudKey
): boolean {
  return permissions[moduleSlug]?.[op] ?? false;
}
