"use client";

import type { DashboardUser } from "@/lib/auth/dashboard-user";
import { createContext, useContext, type ReactNode } from "react";

const DashboardUserContext = createContext<DashboardUser | null>(null);

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser;
  children: ReactNode;
}) {
  return (
    <DashboardUserContext.Provider value={user}>{children}</DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUser {
  const v = useContext(DashboardUserContext);
  if (!v) {
    throw new Error("useDashboardUser must be used within DashboardUserProvider");
  }
  return v;
}
