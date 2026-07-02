"use client";

import { coachMeetingStepHref, coachMeetingStepTitle } from "@/lib/onboarding/coach-meeting-labels";
import {
  coachMeetingStepDisplay,
  firstMissionStepDisplay,
  firstMissionStepTitle,
  trainingStepDisplay,
} from "@/lib/onboarding/onboarding-step-display";
import {
  type MemberOnboardingSnapshot,
  type TrainingStepStatus,
} from "@/lib/onboarding/member-onboarding-status";
import { resolveOnboardingStepStatusHref } from "@/lib/onboarding/onboarding-navigation";
import { OnboardingStatusWithInfo } from "@/components/dashboard/onboarding/OnboardingStatusWithInfo";
import { faCheck, faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  statusLabel: string;
  statusTooltip: string;
  statusHref: string | null;
};

function bulletColor(status: string, enabled: boolean): string {
  if (status === "completed") return "#22c55e";
  if (!enabled || status === "locked") return "#9ca3af";
  if (status === "in_progress" || status === "pending") return "#f1900f";
  return "#9ca3af";
}

function statusBulletIcon(status: string) {
  if (status === "completed") return faCheck;
  if (status === "locked") return faLock;
  return faUnlock;
}

function isSubItemSelected(item: SubItem, pathname: string): boolean {
  if (item.key === "bc") {
    return pathname === "/dashboard/training";
  }
  if (!item.href) return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isSubItemRouteActive(item: SubItem, pathname: string): boolean {
  if (item.key === "bc") {
    return pathname === "/dashboard/training";
  }
  if (!item.href) return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isItemEnabled(item: SubItem, snapshot: MemberOnboardingSnapshot): boolean {
  if (item.key === "bc") return true;
  if (item.key === "coach") return item.status !== "locked";
  if (item.key === "mission") return snapshot.coachMeeting === "completed";
  return false;
}

function buildSubItems(snapshot: MemberOnboardingSnapshot): SubItem[] {
  const coachLabel = coachMeetingStepTitle(snapshot.rankAudience);
  const trainingDisplay = trainingStepDisplay(snapshot.training);
  const coachDisplay = coachMeetingStepDisplay(snapshot.coachMeeting, snapshot.rankAudience);
  const missionDisplay = firstMissionStepDisplay(snapshot.firstMission, snapshot.rankAudience);

  return [
    {
      key: "bc",
      label: "Biblical Citizenship",
      href: "/dashboard/training",
      status: snapshot.training,
      trainingStatus: snapshot.training,
      statusLabel: trainingDisplay.label,
      statusTooltip: trainingDisplay.tooltip,
      statusHref: resolveOnboardingStepStatusHref("training", snapshot),
    },
    {
      key: "coach",
      label: coachLabel,
      href: coachMeetingStepHref(snapshot.rankAudience),
      status: snapshot.coachMeeting,
      trainingStatus: snapshot.training,
      statusLabel: coachDisplay.label,
      statusTooltip: coachDisplay.tooltip,
      statusHref: resolveOnboardingStepStatusHref("coachMeeting", snapshot),
    },
    {
      key: "mission",
      label: firstMissionStepTitle(),
      href: "/dashboard/missions",
      status: snapshot.firstMission,
      trainingStatus: snapshot.training,
      statusLabel: missionDisplay.label,
      statusTooltip: missionDisplay.tooltip,
      statusHref: resolveOnboardingStepStatusHref("firstMission", snapshot),
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
  const subActive = subItems.some((item) => isSubItemRouteActive(item, pathname));
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
              const selected = isSubItemSelected(item, pathname);
              const bullet = bulletColor(item.status, enabled);
              const bulletIcon = statusBulletIcon(item.status);
              const content = (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, py: 0.5, pl: "3px" }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 13,
                      borderTop: "1px dashed rgba(255,255,255,0.28)",
                      mt: 0.95,
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    aria-hidden
                    sx={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      bgcolor: bullet,
                      flexShrink: 0,
                      mt: 0.45,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: item.status === "completed" ? "#fff" : "#0a0a0a",
                      boxShadow:
                        item.status === "in_progress" && enabled
                          ? "inset 0 1px 2px rgba(255,255,255,0.45)"
                          : "none",
                    }}
                  >
                    <FontAwesomeIcon icon={bulletIcon} style={{ width: 8, height: 8, fontSize: 8 }} />
                  </Box>
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
                      <OnboardingStatusWithInfo
                        label={item.statusLabel}
                        tooltip={item.statusTooltip}
                        href={enabled ? null : item.statusHref}
                        size="small"
                      />
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
                        pl: "3px",
                        "&.Mui-selected": { bgcolor: "rgba(255,215,0,0.06)" },
                      }}
                    >
                      {content}
                    </ListItemButton>
                  ) : (
                    <Box sx={{ px: 0, pl: "3px", width: "100%", cursor: "default" }}>{content}</Box>
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
