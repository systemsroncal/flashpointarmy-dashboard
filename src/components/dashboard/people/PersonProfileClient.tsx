"use client";

import { ChapterSearchAutocomplete } from "@/components/forms/ChapterSearchAutocomplete";
import { UsStateSearchAutocomplete } from "@/components/forms/UsStateSearchAutocomplete";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type { ChapterSearchRow } from "@/lib/chapters/chapter-search";
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
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
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
  chapterOptions: ChapterSearchRow[];
};

function formatState(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  const u = usStateByCode(c);
  return u ? `${u.name} (${u.code})` : c;
}

function formatAddress(p: {
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}): string | null {
  const line1 = p.address_line?.trim() || "";
  const cityState = [p.city?.trim(), formatState(p.state)].filter(Boolean).join(", ");
  const zip = p.zip_code?.trim() || "";
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

const panelSx = {
  bgcolor: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 2,
} as const;

export function PersonProfileClient({ person: initialPerson, initialTab, backHref, chapterOptions }: Props) {
  const router = useRouter();
  const [person, setPerson] = useState(initialPerson);
  const [tab, setTab] = useState<PersonProfileTab>(initialTab);
  const [editing, setEditing] = useState(false);
  const [msgDir, setMsgDir] = useState<"received" | "sent">("received");
  const [activity, setActivity] = useState<PersonActivityItem[] | null>(null);
  const [messages, setMessages] = useState<PersonMessageItem[] | null>(null);
  const [notes, setNotes] = useState<PersonNoteItem[] | null>(null);
  const [loadingPane, setLoadingPane] = useState(false);
  const [paneError, setPaneError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(initialPerson.first_name ?? "");
  const [lastName, setLastName] = useState(initialPerson.last_name ?? "");
  const [phone, setPhone] = useState(initialPerson.phone ?? "");
  const [addressLine, setAddressLine] = useState(initialPerson.address_line ?? "");
  const [city, setCity] = useState(initialPerson.city ?? "");
  const [state, setState] = useState(initialPerson.state ?? "");
  const [zipCode, setZipCode] = useState(initialPerson.zip_code ?? "");
  const [chapterId, setChapterId] = useState(initialPerson.primary_chapter_id ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialPerson.date_of_birth?.slice(0, 10) ?? "");
  const [gender, setGender] = useState<"" | "male" | "female">(
    initialPerson.gender === "male" || initialPerson.gender === "female" ? initialPerson.gender : ""
  );

  useEffect(() => {
    setPerson(initialPerson);
  }, [initialPerson]);

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
    if (editing && next !== "profile") {
      setEditing(false);
      setSaveError(null);
    }
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  function startEdit() {
    setActionsAnchor(null);
    setSaveError(null);
    setFirstName(person.first_name ?? "");
    setLastName(person.last_name ?? "");
    setPhone(person.phone ?? "");
    setAddressLine(person.address_line ?? "");
    setCity(person.city ?? "");
    setState(person.state ?? "");
    setZipCode(person.zip_code ?? "");
    setChapterId(person.primary_chapter_id ?? "");
    setDateOfBirth(person.date_of_birth?.slice(0, 10) ?? "");
    setGender(person.gender === "male" || person.gender === "female" ? person.gender : "");
    setTab("profile");
    setEditing(true);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "profile");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function saveEdit() {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setSaveError("First name and last name are required.");
      return;
    }
    if (!chapterId) {
      setSaveError("Select a primary chapter.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/community/members/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fn,
          lastName: ln,
          phone: phone.trim() || null,
          primaryChapterId: chapterId,
          addressLine: addressLine.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zipCode: zipCode.trim() || null,
          dateOfBirth: dateOfBirth.trim() || null,
          gender: gender || null,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        user?: {
          first_name: string;
          last_name: string;
          display_name: string;
          phone: string | null;
          address_line: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          primary_chapter_id: string;
          date_of_birth: string | null;
          gender: string | null;
        };
      };
      if (!res.ok) throw new Error(json.error ?? "Could not save profile.");
      const u = json.user!;
      const ch = chapterOptions.find((c) => c.id === u.primary_chapter_id) ?? null;
      setPerson((prev) => ({
        ...prev,
        first_name: u.first_name,
        last_name: u.last_name,
        display_name: u.display_name,
        phone: u.phone,
        address_line: u.address_line,
        city: u.city,
        state: u.state,
        zip_code: u.zip_code,
        primary_chapter_id: u.primary_chapter_id,
        date_of_birth: u.date_of_birth,
        gender: u.gender,
        chapter: ch
          ? { id: ch.id, name: ch.name, city: ch.city, state: ch.state }
          : prev.chapter?.id === u.primary_chapter_id
            ? prev.chapter
            : null,
      }));
      setEditing(false);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
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
  const genderLabel = formatGender(person.gender);
  const birthday = formatBirthday(person.date_of_birth);

  return (
    <Box sx={{ width: "100%", maxWidth: 1680, mx: "auto", pb: 4 }}>
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
              width: 80,
              height: 80,
              bgcolor: "primary.dark",
              fontSize: "1.5rem",
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
            sx={{ borderColor: "rgba(255,255,255,0.2)", maxWidth: 280 }}
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
            <MenuItem component={Link} href={backHref} onClick={() => setActionsAnchor(null)}>
              Back to list
            </MenuItem>
            {person.canEdit ? (
              <MenuItem
                onClick={() => startEdit()}
                disabled={editing}
              >
                Edit
              </MenuItem>
            ) : null}
          </Menu>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        <Paper elevation={0} sx={{ ...panelSx, py: 1 }}>
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

        <Box sx={{ minWidth: 0 }}>
          {paneError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paneError}
            </Alert>
          ) : null}

          {tab === "profile" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
                gap: 3,
              }}
            >
              <Paper elevation={0} sx={{ ...panelSx, px: { xs: 2, sm: 3 }, py: 1 }}>
                {editing ? (
                  <Box sx={{ py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>
                        Edit profile
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button onClick={cancelEdit} disabled={saving} color="inherit">
                          Cancel
                        </Button>
                        <Button variant="contained" onClick={() => void saveEdit()} disabled={saving}>
                          {saving ? "Saving…" : "Save"}
                        </Button>
                      </Stack>
                    </Stack>
                    {saveError ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {saveError}
                      </Alert>
                    ) : null}
                    <Stack spacing={2}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                          label="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          fullWidth
                        />
                        <TextField
                          label="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          fullWidth
                        />
                      </Stack>
                      <TextField
                        label="Email"
                        value={person.email}
                        fullWidth
                        disabled
                        helperText="Email is managed from the directory sign-in tools."
                      />
                      <TextField
                        label="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Address"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        fullWidth
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                          label="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          fullWidth
                        />
                        <UsStateSearchAutocomplete
                          valueCode={state}
                          onSelectCode={(code) => setState(code)}
                          label="State"
                        />
                        <TextField
                          label="ZIP"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          sx={{ minWidth: { sm: 140 } }}
                        />
                      </Stack>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel id="person-gender-label">Gender</InputLabel>
                          <Select
                            labelId="person-gender-label"
                            label="Gender"
                            value={gender}
                            onChange={(e) =>
                              setGender(e.target.value as "" | "male" | "female")
                            }
                          >
                            <MenuItem value="">—</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Birthday"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>
                      <ChapterSearchAutocomplete
                        chapters={chapterOptions}
                        valueId={chapterId}
                        onChangeId={setChapterId}
                        allowNameAndAddressSearch
                        required
                      />
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ py: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                          Contact information
                        </Typography>
                        {person.canEdit ? (
                          <Button size="small" startIcon={<EditOutlinedIcon />} onClick={startEdit}>
                            Edit
                          </Button>
                        ) : null}
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
                        value={genderLabel}
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
                  </>
                )}
              </Paper>

              <Paper elevation={0} sx={{ ...panelSx, p: 2.5, height: "fit-content" }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Chapter
                </Typography>
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
            <Paper elevation={0} sx={{ ...panelSx, p: 3, minHeight: 320 }}>
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
            <Paper elevation={0} sx={{ ...panelSx, p: 3, minHeight: 360 }}>
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
            <Paper elevation={0} sx={{ ...panelSx, p: 3, minHeight: 360 }}>
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
    <Box sx={{ py: 6, px: 2, textAlign: "center", maxWidth: 480, mx: "auto" }}>
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
