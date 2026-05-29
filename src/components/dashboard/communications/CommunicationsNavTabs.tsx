"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Tab, Tabs } from "@mui/material";

const TABS = [
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Templates", href: "/dashboard/communications/templates" },
  { label: "Send", href: "/dashboard/communications/send" },
  { label: "History", href: "/dashboard/communications/history" },
];

export function CommunicationsNavTabs() {
  const pathname = usePathname();
  const value =
    TABS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.href ??
    "/dashboard/notifications";

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
      <Tabs value={value} variant="scrollable" scrollButtons="auto">
        {TABS.map((t) => (
          <Tab key={t.href} label={t.label} value={t.href} component={Link} href={t.href} />
        ))}
      </Tabs>
    </Box>
  );
}
