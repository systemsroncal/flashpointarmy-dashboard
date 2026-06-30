"use client";

import { coachMeetingStepTitle } from "@/lib/onboarding/coach-meeting-labels";
import {
  formatOnboardingStepLabel,
  type MemberOnboardingSnapshot,
  type TrainingStepStatus,
} from "@/lib/onboarding/member-onboarding-status";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/School";
import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SubItem = {
  key: string;
  label: string;
  href: string | null;
  status: string;
  trainingStatus?: TrainingStepStatus;
};

function bulletColor(status: string, enabled: boolean): string {
  if (!enabled) return "#9ca3af";
  if (status === "completed") return "#22c55e";
  if (status === "in_progress" || status === "pending") return "#f1900f";
  return "#9ca3af";
}

function isItemEnabled(item: SubItem, snapshot: MemberOnboardingSnapshot): boolean {
  if (item.key === "bc") return true;
  if (item.key === "coach") return item.status !== "locked";
  if (item.key === "mission") return snapshot.coachMeeting === "completed";
  return false;
}

function buildSubItems(snapshot: MemberOnboardingSnapshot): SubItem[] {
  const coachLabel = coachMeetingStepTitle(snapshot.rankAudience);
  return [
    {
      key: "bc",
      label: "Biblical Citizenship",
      href: `/dashboard/course/${BIBLICAL_CITIZENSHIP_COURSE_SLUG}`,
      status: snapshot.training,
      trainingStatus: snapshot.training,
    },
    {
      key: "coach",
      label: coachLabel,
      href: "/dashboard/training/coach-meeting",
      status: snapshot.coachMeeting,
      trainingStatus: snapshot.training,
    },
    {
      key: "mission",
      label: "Choose Your Mission",
      href: "/dashboard/missions",
      status: snapshot.firstMission,
      trainingStatus: snapshot.training,
    },
  ];
}

type Props = {
  snapshot: MemberOnboardingSnapshot;
  selectedParent: boolean;
  onNavigate?: () => void;
  navItemTouchSx: Record<string, unknown>;
  navSelectedSx: Record<string, unknown>;
};

export function TrainingNavSubmenu({
  snapshot,
  selectedParent,
  onNavigate,
  navItemTouchSx,
  navSelectedSx,
}: Props) {
  const pathname = usePathname();
  const subItems = useMemo(() => buildSubItems(snapshot), [snapshot]);
  const subActive = subItems.some(
    (item) => item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  const [open, setOpen] = useState(selectedParent || subActive);

  useEffect(() => {
    if (selectedParent || subActive) setOpen(true);
  }, [selectedParent, subActive]);

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setOpen((p) => !p)}
          selected={selectedParent}
          sx={{
            ...navItemTouchSx,
            py: 0.75,
            "&.Mui-selected": navSelectedSx,
          }}
        >
          <ListItemIcon
            sx={{
              color: selectedParent ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText
            primary="Training"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: selectedParent ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 2.25, pr: 1, pb: 0.5, position: "relative" }}>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: 18,
              top: 4,
              bottom: 8,
              width: 2,
              bgcolor: "#22c55e",
              borderRadius: 1,
            }}
          />
          <List disablePadding sx={{ position: "relative" }}>
            {subItems.map((item) => {
              const enabled = isItemEnabled(item, snapshot);
              const selected = Boolean(
                item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
              );
              const bullet = bulletColor(item.status, enabled);
              const content = (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.65, pl: 1.5 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 28,
                      borderTop: "1px dashed rgba(255,255,255,0.28)",
                      mt: 1.1,
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    sx={{
                      width: 14,
                      height: 10,
                      borderRadius: 999,
                      bgcolor: bullet,
                      flexShrink: 0,
                      mt: 0.85,
                      boxShadow:
                        item.status === "in_progress" && enabled
                          ? "inset 0 1px 2px rgba(255,255,255,0.45)"
                          : "none",
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        color: enabled ? "#fff" : "rgba(255,255,255,0.38)",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.label}
                    </Box>
                    <Box
                      sx={{
                        color: enabled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)",
                        fontSize: "0.68rem",
                      }}
                    >
                      {formatOnboardingStepLabel(item.status)}
                    </Box>
                  </Box>
                </Box>
              );

              return (
                <ListItem key={item.key} disablePadding sx={{ pl: 0 }}>
                  {enabled && item.href ? (
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={selected}
                      onClick={onNavigate}
                      sx={{
                        ...navItemTouchSx,
                        py: 0,
                        px: 0,
                        "&.Mui-selected": { bgcolor: "rgba(255,215,0,0.06)" },
                      }}
                    >
                      {content}
                    </ListItemButton>
                  ) : (
                    <Box sx={{ px: 0, width: "100%", cursor: "default" }}>{content}</Box>
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Collapse>
    </>
  );
}
