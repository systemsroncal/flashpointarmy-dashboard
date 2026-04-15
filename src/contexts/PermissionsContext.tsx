"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CrudKey, ModulePermissionMap } from "@/types/permissions";
import { can } from "@/types/permissions";

const PermissionsContext = createContext<ModulePermissionMap>({});

export function PermissionsProvider({
  value,
  children,
}: {
  value: ModulePermissionMap;
  children: ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

export function useCan(moduleSlug: string, op: CrudKey) {
  const map = usePermissions();
  return can(map, moduleSlug, op);
}
