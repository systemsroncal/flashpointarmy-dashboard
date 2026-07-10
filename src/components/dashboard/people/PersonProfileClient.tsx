"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type {
  PersonActivityItem,
  PersonMessageItem,
  PersonNoteItem,
  PersonProfileData,
  PersonProfileTab,
} from "@/lib/people/person-profile-data";
import { personFullName, personInitials } from "@/lib/people/person-profile-data";
import { usStateByCode } from "@/data/usStates";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Props = {
  person: PersonProfileData;
  initialTab: PersonProfileTab;
  backHref: string;
};

function formatState(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  const u = usStateByCode(c);
  return u ? `${u.name} (${u.code})` : c;
}

function formatAddress(person: PersonProfileData): string | null {
  const line1 = person.address_line?.trim() || "";
  const cityState = [person.city?.trim(), formatState(person.state)].filter(Boolean).join(", ");
  const zip = person.zip_code?.trim() || "";
  const parts = [line1, [cityState, zip].filter(Boolean).join(" ")].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

function formatGender(g: string | null): string | null {
  if (!g) return null;
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return g;
}

function formatBirthday(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatRole(slug: string): string {
  return slug
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function FieldRow({
  icon,
  label,
  value,
  emptyLabel,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  emptyLabel: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1.25 }}>
      <Box sx={{ color: "text.secondary", mt: 0.25, display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{ letterSpacing: "0.06em", color: "text.secondary", fontWeight: 700 }}
        >
          {label}
        </Typography>
        {value ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", mt: 0.25 }}>
            {value}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {emptyLabel}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

const NAV: { id: PersonProfileTab; label: string; icon: ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <EditOutlinedIcon fontSize="small" /> },
  { id: "activity", label: "Activity", icon: <ShowChartOutlinedIcon fontSize="small" /> },
  { id: "communication", label: "Communication", icon: <ChatBubbleOutlineIcon fontSize="small" /> },
  { id: "notes", label: "Notes", icon: <NoteOutlinedIcon fontSize="small" /> },
];

export function PersonProfileClient({ person, initialTab, backHref }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<PersonProfileTab>(initialTab);
  const [msgDir, setMsgDir] = useState<"received" | "sent">("received");
  const [activity, setActivity] = useState<PersonActivityItem[] | null>(null);
  const [messages, setMessages] = useState<PersonMessageItem[] | null>(null);
  const [notes, setNotes] = useState<PersonNoteItem[] | null>(null);
  const [loadingPane, setLoadingPane] = useState(false);
  const [paneError, setPaneError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);

  const fullName = useMemo(() => personFullName(person), [person]);
  const initials = useMemo(() => personInitials(person), [person]);
  const membershipLabel = useMemo(() => {
    if (person.role_names.includes("super_admin")) return "Super admin";
    if (person.role_names.includes("admin")) return "Administrator";
    if (person.role_names.includes("sub_admin")) return "Sub administrator";
    if (person.role_names.includes("local_leader")) return "Local leader";
    if (person.role_names.includes("member")) return "Member";
    return person.role_names[0] ? formatRole(person.role_names[0]) : "Member";
  }, [person.role_names]);

  const loadTabData = useCallback(
    async (next: PersonProfileTab, direction: "received" | "sent" = msgDir) => {
      if (next === "profile") return;
      setLoadingPane(true);
      setPaneError(null);
      try {
        if (next === "activity") {
          const res = await fetch(`/api/people/${person.id}/activity`, { cache: "no-store" });
          const json = (await res.json()) as { error?: string; items?: PersonActivityItem[] };
          if (!res.ok) throw new Error(json.error ?? "Failed to load activity.");
          setActivity(json.items ?? []);
        } else if (next === "communication") {
          const res = await fetch(
            `/api/people/${person.id}/messages?direction=${direction}`,
            { cache: "no-store" }
          );
          const json = (await res.json()) as { error?: string; items?: PersonMessageItem[] };
          if (!res.ok) throw new Error(json.error ?? "Failed to load messages.");
          setMessages(json.items ?? []);
        } else if (next === "notes") {
          const res = await fetch(`/api/people/${person.id}/notes`, { cache: "no-store" });
          const json = (await res.json()) as { error?: string; items?: PersonNoteItem[] };
          if (!res.ok) throw new Error(json.error ?? "Failed to load notes.");
          setNotes(json.items ?? []);
        }
      } catch (e) {
        setPaneError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoadingPane(false);
      }
    },
    [msgDir, person.id]
  );

  useEffect(() => {
    void loadTabData(tab, msgDir);
  }, [tab, msgDir, loadTabData]);

  function selectTab(next: PersonProfileTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  async function saveNote() {
    const body = noteDraft.trim();
    if (!body) return;
    setNoteSaving(true);
    setPaneError(null);
    try {
      const res = await fetch(`/api/people/${person.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json()) as { error?: string; item?: PersonNoteItem };
      if (!res.ok) throw new Error(json.error ?? "Could not save note.");
      setNoteDraft("");
      setNotes((prev) => [json.item!, ...(prev ?? [])]);
    } catch (e) {
      setPaneError(e instanceof Error ? e.message : "Could not save note.");
    } finally {
      setNoteSaving(false);
    }
  }

  const address = formatAddress(person);
  const gender = formatGender(person.gender);
  const birthday = formatBirthday(person.date_of_birth);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <IconButton component={Link} href={backHref} aria-label="Close profile">
          <CloseIcon />
        </IconButton>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={person.avatar_url ? publicAssetSrc(person.avatar_url) : undefined}
            sx={{
              width: 72,
              height: 72,
              bgcolor: "primary.dark",
              fontSize: "1.4rem",
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[person.email, person.phone?.trim()].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<PersonOutlineIcon />}
            label={membershipLabel}
            variant="outlined"
            sx={{ borderColor: "rgba(255,255,255,0.2)" }}
          />
          <Chip
            icon={<LocationOnOutlinedIcon />}
            label={person.chapter?.name ?? "No chapter"}
            variant="outlined"
            sx={{ borderColor: "rgba(255,255,255,0.2)", maxWidth: 240 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setActionsAnchor(e.currentTarget)}
            sx={{ borderColor: "rgba(255,255,255,0.2)", color: "text.primary" }}
          >
            Actions
          </Button>
          <Menu
            anchorEl={actionsAnchor}
            open={Boolean(actionsAnchor)}
            onClose={() => setActionsAnchor(null)}
          >
            <MenuItem
              component={Link}
              href={
                person.role_names.includes("local_leader")
                  ? "/dashboard/leaders"
                  : person.role_names.some((r) =>
                      ["admin", "super_admin", "sub_admin"].includes(r)
                    )
                  ? "/dashboard/admins"
                  : "/dashboard/community"
              }
              onClick={() => setActionsAnchor(null)}
            >
              Back to list
            </MenuItem>
            {person.canEdit ? (
              <MenuItem
                component={Link}
                href={
                  person.role_names.some((r) =>
                    ["admin", "super_admin", "sub_admin"].includes(r)
                  )
                    ? "/dashboard/admins"
                    : person.role_names.includes("local_leader")
                      ? "/dashboard/leaders"
                      : "/dashboard/community"
                }
                onClick={() => setActionsAnchor(null)}
              >
                Edit in directory
              </MenuItem>
            ) : null}
          </Menu>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "200px 1fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            bgcolor: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2,
            py: 1,
          }}
        >
          <List dense disablePadding>
            {NAV.map((item) => {
              const selected = tab === item.id;
              return (
                <ListItemButton
                  key={item.id}
                  selected={selected}
                  onClick={() => selectTab(item.id)}
                  sx={{
                    mx: 1,
                    borderRadius: 1.5,
                    "&.Mui-selected": {
                      bgcolor: "rgba(56, 189, 248, 0.12)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: selected ? "primary.light" : "text.secondary" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: "0.92rem" }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        <Box>
          {paneError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paneError}
            </Alert>
          ) : null}

          {tab === "profile" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" },
                gap: 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  bgcolor: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  px: { xs: 2, sm: 3 },
                  py: 1,
                }}
              >
                <Box sx={{ py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Contact information
                    </Typography>
                  </Stack>
                  <FieldRow
                    icon={<EmailOutlinedIcon fontSize="small" />}
                    label="HOME"
                    value={person.email || null}
                    emptyLabel="No email"
                  />
                  <FieldRow
                    icon={<PhoneOutlinedIcon fontSize="small" />}
                    label="MOBILE"
                    value={person.phone?.trim() || null}
                    emptyLabel="No phone"
                  />
                  <FieldRow
                    icon={<HomeOutlinedIcon fontSize="small" />}
                    label="ADDRESS"
                    value={address}
                    emptyLabel="No address"
                  />
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <Box sx={{ py: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Personal information
                  </Typography>
                  <FieldRow
                    icon={<PersonOutlineIcon fontSize="small" />}
                    label="GENDER"
                    value={gender}
                    emptyLabel="No gender"
                  />
                  <FieldRow
                    icon={<CakeOutlinedIcon fontSize="small" />}
                    label="BIRTHDAY"
                    value={birthday}
                    emptyLabel="No birthday"
                  />
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <Box sx={{ py: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Roles
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    {person.role_names.length ? (
                      person.role_names.map((r) => (
                        <Chip key={r} size="small" label={formatRole(r)} variant="outlined" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  bgcolor: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  p: 2.5,
                  height: "fit-content",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Chapter
                  </Typography>
                </Stack>
                {person.chapter ? (
                  <Box>
                    <Typography fontWeight={600}>{person.chapter.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {[person.chapter.city, formatState(person.chapter.state)]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {fullName} has not been assigned to a chapter yet.
                  </Typography>
                )}
              </Paper>
            </Box>
          ) : null}

          {tab === "activity" ? (
            <Paper
              elevation={0}
              sx={{
                bgcolor: "rgba(0,0,0,0.28)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
                p: 3,
                minHeight: 320,
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Recent activity
              </Typography>
              {loadingPane ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : !activity?.length ? (
                <EmptyPane
                  title={`No activity for ${fullName}`}
                  body="When this person triggers account events (registration, chapter changes, training), they will appear here."
                />
              ) : (
                <Stack spacing={0} divider={<Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}>
                  {activity.map((item) => (
                    <Box key={item.id} sx={{ py: 1.5 }}>
                      <Typography fontWeight={600}>{item.title}</Typography>
                      {item.body ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {item.body}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          ) : null}

          {tab === "communication" ? (
            <Paper
              elevation={0}
              sx={{
                bgcolor: "rgba(0,0,0,0.28)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
                p: 3,
                minHeight: 360,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailOutlinedIcon fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>
                    Recent messages — {msgDir === "received" ? "Received" : "Sent"}
                  </Typography>
                </Stack>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={msgDir}
                  onChange={(_, v) => {
                    if (v) setMsgDir(v);
                  }}
                >
                  <ToggleButton value="received">Received</ToggleButton>
                  <ToggleButton value="sent">Sent</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {loadingPane ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : !messages?.length ? (
                <EmptyPane
                  title={`No messages for ${fullName}`}
                  body={
                    msgDir === "received"
                      ? "System emails and broadcast messages sent to this person will show up here."
                      : "Emails this person triggered from the dashboard will show up here."
                  }
                />
              ) : (
                <Stack spacing={0} divider={<Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}>
                  {messages.map((m) => (
                    <Box key={m.id} sx={{ py: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={m.channel} variant="outlined" />
                        {m.status ? <Chip size="small" label={m.status} /> : null}
                      </Stack>
                      <Typography fontWeight={600} sx={{ mt: 0.75 }}>
                        {m.subject ?? "Message"}
                      </Typography>
                      {m.preview ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {m.preview}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(m.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          ) : null}

          {tab === "notes" ? (
            <Paper
              elevation={0}
              sx={{
                bgcolor: "rgba(0,0,0,0.28)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
                p: 3,
                minHeight: 360,
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Notes
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder={`Add a private staff note about ${fullName}…`}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <Box>
                  <Button
                    variant="contained"
                    disabled={noteSaving || !noteDraft.trim()}
                    onClick={() => void saveNote()}
                  >
                    {noteSaving ? "Saving…" : "Add note"}
                  </Button>
                </Box>
              </Stack>
              {loadingPane ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : !notes?.length ? (
                <EmptyPane
                  title={`No notes for ${fullName}`}
                  body="Staff notes are visible only to administrators and sub-administrators."
                />
              ) : (
                <Stack spacing={0} divider={<Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}>
                  {notes.map((n) => (
                    <Box key={n.id} sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {n.body}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {n.author_name} · {new Date(n.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function EmptyPane({ title, body }: { title: string; body: string }) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: "center",
        maxWidth: 420,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          mx: "auto",
          mb: 2,
          borderRadius: "50%",
          bgcolor: "rgba(56,189,248,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "primary.light",
        }}
      >
        <ChatBubbleOutlineIcon sx={{ fontSize: 36 }} />
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {body}
      </Typography>
    </Box>
  );
}
