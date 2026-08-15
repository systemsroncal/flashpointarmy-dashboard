"use client";

import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import {
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";
import { flashpointYellow } from "@/theme/tokens";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import MapIcon from "@mui/icons-material/Map";
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
import { useCallback, useEffect, useMemo, useState } from "react";

const NAV_ITEM_TOUCH_SX = {
  minHeight: 48,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  "& .MuiListItemIcon-root, & .MuiListItemText-root": {
    pointerEvents: "none",
  },
} as const;

const NAV_SELECTED_SX = {
  borderLeft: "3px solid",
  borderColor: "primary.main",
  bgcolor: "rgba(255,215,0,0.08)",
} as const;

const GROUP_NAME_ACTIVE_SX = {
  bgcolor: flashpointYellow,
  "&:hover": { bgcolor: flashpointYellow },
  "& .MuiListItemText-primary": {
    color: "#0a0a0a",
    fontWeight: 700,
    lineHeight: 1.15,
  },
} as const;

type MyGroupRow = {
  id: string;
  name: string;
};

function SidebarGroupNameLink({
  name,
  href,
  isActive,
  onNavigate,
}: {
  name: string;
  href: string;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        onClick={onNavigate}
        sx={{
          py: 0.35,
          minHeight: 36,
          borderRadius: 1,
          mx: 0.5,
          maxWidth: 155,
          ...(isActive ? GROUP_NAME_ACTIVE_SX : {}),
        }}
      >
        <ListItemText
          primary={name}
          sx={{ m: 0, minWidth: 0, overflow: "hidden" }}
          primaryTypographyProps={{
            variant: "body2",
            fontSize: "0.8rem",
            fontWeight: isActive ? 700 : 600,
            lineHeight: isActive ? 1.15 : undefined,
            color: isActive ? "#0a0a0a" : undefined,
            noWrap: true,
            title: name,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

type Props = {
  onNavigate?: () => void;
  /** When true, show the parent but disable navigation into Mobilize. */
  disabled?: boolean;
};

/**
 * Unified-sidebar parent for Chapters & Groups → Find Chapters / My Groups
 * (with an expandable list of the viewer's groups under My Groups).
 */
export function ChaptersGroupsNavGroup({ onNavigate, disabled = false }: Props) {
  const pathname = usePathname();
  const [parentOpen, setParentOpen] = useState(false);
  const [myGroupsOpen, setMyGroupsOpen] = useState(false);
  const [myGroups, setMyGroups] = useState<MyGroupRow[]>([]);

  const activeGroupId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/mobilize\/groups\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const onChaptersPage =
    pathname === MOBILIZE_CHAPTERS_HREF || pathname === `${MOBILIZE_PREFIX}/`;
  const onMyGroupsPage = pathname === MOBILIZE_MY_GROUPS_HREF;
  const onGroupDetail = Boolean(activeGroupId);
  const chaptersGroupsActive =
    onChaptersPage ||
    onMyGroupsPage ||
    onGroupDetail ||
    pathname.startsWith(`${MOBILIZE_PREFIX}/map`);

  useEffect(() => {
    if (chaptersGroupsActive) setParentOpen(true);
  }, [chaptersGroupsActive]);

  useEffect(() => {
    if (onMyGroupsPage || onGroupDetail) setMyGroupsOpen(true);
  }, [onMyGroupsPage, onGroupDetail]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/my-groups");
        const json = (await res.json()) as { groups?: MyGroupRow[] };
        if (!cancelled && res.ok) {
          setMyGroups(
            (json.groups ?? []).map((g) => ({ id: g.id, name: g.name }))
          );
        }
      } catch {
        if (!cancelled) setMyGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const sidebarMyGroups = useMemo(
    () => myGroups.slice(0, MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT),
    [myGroups]
  );
  const showMyGroupsTree = myGroups.length > 0;
  const toggleMyGroups = useCallback(() => setMyGroupsOpen((v) => !v), []);

  if (disabled) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          disabled
          aria-disabled
          data-tour="nav-chapters-groups"
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            opacity: 0.42,
            cursor: "default",
            "&.Mui-disabled": { opacity: 0.42 },
          }}
        >
          <ListItemIcon sx={{ color: "rgba(255,255,255,0.5)", minWidth: 38 }}>
            <FlagOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Chapters & Groups"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: "rgba(255,255,255,0.45)",
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setParentOpen((prev) => !prev)}
          selected={chaptersGroupsActive}
          data-tour="nav-chapters-groups"
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: chaptersGroupsActive ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <FlagOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Chapters & Groups"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: chaptersGroupsActive ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {parentOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={parentOpen} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 1.25, pb: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href={MOBILIZE_CHAPTERS_HREF}
              selected={onChaptersPage}
              data-tour="nav-find-chapters"
              onClick={onNavigate}
              sx={{
                ...NAV_ITEM_TOUCH_SX,
                py: 0.5,
                minHeight: 40,
                "&.Mui-selected": NAV_SELECTED_SX,
              }}
            >
              <ListItemIcon
                sx={{
                  color: onChaptersPage ? "primary.main" : "rgba(255,255,255,0.92)",
                  minWidth: 34,
                }}
              >
                <MapIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Find Chapters"
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: onChaptersPage ? "primary.main" : "rgba(255,255,255,0.88)",
                }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href={MOBILIZE_MY_GROUPS_HREF}
              selected={onMyGroupsPage && !myGroupsOpen}
              data-tour="nav-my-groups"
              onClick={onNavigate}
              sx={{
                ...NAV_ITEM_TOUCH_SX,
                py: 0.5,
                minHeight: 40,
                "&.Mui-selected": NAV_SELECTED_SX,
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    onMyGroupsPage || onGroupDetail
                      ? "primary.main"
                      : "rgba(255,255,255,0.92)",
                  minWidth: 34,
                }}
              >
                <Groups2OutlinedIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="My Groups"
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color:
                    onMyGroupsPage || onGroupDetail
                      ? "primary.main"
                      : "rgba(255,255,255,0.88)",
                }}
              />
              {showMyGroupsTree ? (
                <Box
                  component="span"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMyGroups();
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "rgba(255,255,255,0.72)",
                    p: 0.5,
                    pointerEvents: "auto",
                  }}
                >
                  {myGroupsOpen ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </Box>
              ) : null}
            </ListItemButton>
          </ListItem>
          <Collapse in={showMyGroupsTree && myGroupsOpen} timeout="auto" unmountOnExit>
            <List dense disablePadding sx={{ pl: 1.5, pb: 0.5 }}>
              {sidebarMyGroups.map((group) => (
                <SidebarGroupNameLink
                  key={group.id}
                  name={group.name}
                  href={mobilizeGroupDetailHref(group.id)}
                  isActive={activeGroupId === group.id}
                  onNavigate={onNavigate}
                />
              ))}
              {myGroups.length > MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT ? (
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={MOBILIZE_MY_GROUPS_HREF}
                    onClick={onNavigate}
                    sx={{ py: 0.35, minHeight: 36, borderRadius: 1, mx: 0.5 }}
                  >
                    <ListItemText
                      primary="View all"
                      primaryTypographyProps={{
                        variant: "body2",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "primary.main",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ) : null}
            </List>
          </Collapse>
        </List>
      </Collapse>
    </>
  );
}
