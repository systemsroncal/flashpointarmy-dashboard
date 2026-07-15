"use client";

import { SignInEmailChangePanel } from "@/components/auth/SignInEmailChangePanel";
import { CourseGraduateBadge } from "@/components/dashboard/training/CourseGraduateBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { validateAvatarFile } from "@/lib/upload/validate-image";
import { UsStateSearchAutocomplete } from "@/components/forms/UsStateSearchAutocomplete";
import { usStateByCode } from "@/data/usStates";
import { flashpointYellow } from "@/theme/tokens";
import { createClient } from "@/utils/supabase/client";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

const PROFILE_COVER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/07/image-cover-profile-right-scaled.jpg";

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  date_of_birth: string | null;
  gender: string | null;
};

function formatRoleSlug(slug: string): string {
  return slug
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatStateForDisplay(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  const u = usStateByCode(c);
  return u ? `${u.name} (${u.code})` : c;
}

function primaryRoleLabel(roleNames: string[] | undefined): string {
  const names = roleNames ?? [];
  if (names.includes("super_admin")) return "SUPER ADMIN";
  if (names.includes("admin")) return "ADMINISTRATOR";
  if (names.includes("sub_admin")) return "SUB ADMINISTRATOR";
  if (names.includes("local_leader")) return "LOCAL LEADER";
  if (names.includes("member")) return "MEMBER";
  return names[0] ? formatRoleSlug(names[0]).toUpperCase() : "MEMBER";
}

function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function UserProfileDrawer({
  open,
  onClose,
  editMode: editModeControlled,
  onEditModeChange,
}: {
  open: boolean;
  onClose: () => void;
  /** Controlled edit mode (used by the dashboard tour). */
  editMode?: boolean;
  onEditModeChange?: (edit: boolean) => void;
}) {
  const du = useDashboardUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModeInternal, setEditModeInternal] = useState(false);
  const editModeControlledMode = onEditModeChange !== undefined && editModeControlled !== undefined;
  const editMode = editModeControlledMode ? editModeControlled : editModeInternal;
  const setEditMode = editModeControlledMode ? onEditModeChange : setEditModeInternal;
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarNonce, setAvatarNonce] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [groupsCount, setGroupsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const [{ data, error: qErr }, groupsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name, last_name, display_name, avatar_url, phone, address_line, city, state, zip_code, date_of_birth, gender"
        )
        .eq("id", du.id)
        .maybeSingle(),
      supabase
        .from("mobilize_group_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", du.id)
        .eq("membership_status", "approved"),
    ]);
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      return;
    }
    const row = data as ProfileRow | null;
    setProfile(row);
    setFirstName(row?.first_name ?? du.first_name ?? "");
    setLastName(row?.last_name ?? du.last_name ?? "");
    setDisplayName(row?.display_name ?? du.display_name ?? "");
    setPhone(row?.phone?.trim() ?? du.phone?.trim() ?? "");
    setAddrLine(row?.address_line?.trim() ?? "");
    setAddrCity(row?.city?.trim() ?? "");
    setAddrState(row?.state?.trim() ?? "");
    setAddrZip(row?.zip_code?.trim() ?? "");
    setDateOfBirth(row?.date_of_birth?.slice(0, 10) ?? "");
    setGender(row?.gender === "male" || row?.gender === "female" ? row.gender : "");
    setAvatarUrl(row?.avatar_url ?? "");
    setGroupsCount(groupsRes.count ?? 0);
  }, [du.display_name, du.first_name, du.id, du.last_name, du.phone]);

  useEffect(() => {
    if (open) {
      void load();
      setEditMode(false);
    }
  }, [open, load]);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const disp =
      displayName.trim() ||
      [fn, ln].filter(Boolean).join(" ").trim() ||
      du.email.split("@")[0];

    const ph = phone.trim() || null;
    const al = addrLine.trim() || null;
    const ac = addrCity.trim() || null;
    const ast = usStateByCode(addrState)?.code ?? null;
    const az = addrZip.trim() || null;
    const dob = dateOfBirth.trim() || null;
    const g = gender === "male" || gender === "female" ? gender : null;
    const { error: pErr } = await supabase.from("profiles").upsert(
      {
        id: du.id,
        first_name: fn || null,
        last_name: ln || null,
        display_name: disp,
        phone: ph,
        address_line: al,
        city: ac,
        state: ast,
        zip_code: az,
        date_of_birth: dob,
        gender: g,
      },
      { onConflict: "id" }
    );

    if (pErr) {
      setError(pErr.message);
      setSaving(false);
      return;
    }

    const { error: dErr } = await supabase
      .from("dashboard_users")
      .update({
        first_name: fn || null,
        last_name: ln || null,
        display_name: disp,
        phone: ph,
        address_line: al,
        city: ac,
        state: ast,
        zip_code: az,
        updated_at: new Date().toISOString(),
      })
      .eq("id", du.id);

    if (dErr) {
      setError(dErr.message);
      setSaving(false);
      return;
    }

    const { error: authUpdErr } = await supabase.auth.updateUser({
      data: {
        first_name: fn || null,
        last_name: ln || null,
        phone: ph,
        address_line: al,
        city: ac,
        state: ast,
        zip_code: az,
      },
    });
    if (authUpdErr) {
      setError(authUpdErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditMode(false);
    router.refresh();
    onClose();
  }

  async function uploadAvatarFile(file: File) {
    const v = validateAvatarFile(file);
    if (v) {
      setError(v.error);
      return;
    }
    setError(null);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; avatar_url?: string };
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      setAvatarNonce(Date.now());
      router.refresh();
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function clearAvatar() {
    setError(null);
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: du.id,
            avatar_url: null,
            display_name:
              displayName.trim() ||
              profile?.display_name ||
              du.display_name ||
              du.email.split("@")[0],
          },
          { onConflict: "id" }
        );
      if (pErr) {
        setError(pErr.message);
        return;
      }
      setAvatarUrl("");
      setAvatarNonce(Date.now());
      router.refresh();
    } finally {
      setAvatarUploading(false);
    }
  }

  const displayTitle =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    du.display_name ||
    [du.first_name, du.last_name].filter(Boolean).join(" ") ||
    du.email.split("@")[0];

  const avatarSrc = avatarUrl.trim()
    ? `${publicAssetSrc(avatarUrl.trim())}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarNonce || "1"}`
    : undefined;

  const addressLine = useMemo(() => {
    const parts = [
      profile?.address_line?.trim() || addrLine.trim() || null,
      profile?.city?.trim() || addrCity.trim() || null,
      formatStateForDisplay(profile?.state || addrState) || null,
      profile?.zip_code?.trim() || addrZip.trim() || null,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }, [profile, addrLine, addrCity, addrState, addrZip]);

  const roleBadge = primaryRoleLabel(du.role_names);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440 },
          maxWidth: "100vw",
          bgcolor: "#141416",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        data-tour="profile-drawer"
        sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            px: 2,
            pt: 1.5,
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
            bgcolor: "#141416",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonOutlineIcon sx={{ color: flashpointYellow }} />
            <Typography sx={{ color: flashpointYellow, fontWeight: 800, fontSize: "1.05rem" }}>
              Profile
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" sx={{ color: "rgba(255,255,255,0.88)" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box sx={{ position: "relative", mb: 7.5 }}>
                <Box
                  sx={{
                    height: { xs: 168, sm: 188 },
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(20,20,22,0.55) 100%), url(${PROFILE_COVER_URL})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAvatarFile(f);
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    left: "50%",
                    bottom: 0,
                    transform: "translate(-50%, 50%)",
                    zIndex: 1,
                  }}
                >
                  <Box
                    role="button"
                    tabIndex={0}
                    aria-label="Change profile photo"
                    onClick={() => {
                      if (!avatarUploading && !saving) fileInputRef.current?.click();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!avatarUploading && !saving) fileInputRef.current?.click();
                      }
                    }}
                    sx={{
                      position: "relative",
                      display: "inline-flex",
                      cursor: avatarUploading || saving ? "default" : "pointer",
                      borderRadius: "50%",
                    }}
                  >
                    <Avatar
                      src={avatarSrc}
                      sx={{
                        width: 118,
                        height: 118,
                        bgcolor: "primary.dark",
                        fontSize: "2.2rem",
                        fontWeight: 700,
                        border: `4px solid ${flashpointYellow}`,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                        opacity: avatarUploading ? 0.55 : 1,
                      }}
                    >
                      {displayTitle.slice(0, 2).toUpperCase()}
                    </Avatar>
                    {avatarUploading ? (
                      <CircularProgress
                        size={28}
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          mt: "-14px",
                          ml: "-14px",
                        }}
                      />
                    ) : null}
                    <Tooltip title="Change profile photo">
                      <IconButton
                        className="profile-avatar-edit"
                        data-tour="profile-avatar-edit"
                        aria-label="Change profile photo"
                        disabled={avatarUploading || saving}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        sx={{
                          position: "absolute",
                          right: 2,
                          bottom: 2,
                          width: 34,
                          height: 34,
                          bgcolor: flashpointYellow,
                          color: "#111",
                          border: "2px solid #141416",
                          "&:hover": { bgcolor: "#ffe44d" },
                          "&.Mui-disabled": { bgcolor: flashpointYellow, opacity: 0.6 },
                        }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ px: 2.5, pb: 3, textAlign: "center" }}>
                {error ? (
                  <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                    {error}
                  </Alert>
                ) : null}

                {!editMode ? (
                  <Box data-tour="profile-view">
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.45rem", sm: "1.65rem" },
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        color: "#fff",
                      }}
                    >
                      {displayTitle}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1.25,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.25,
                        py: 0.45,
                        borderRadius: 999,
                        border: `1px solid ${flashpointYellow}`,
                        bgcolor: "rgba(0,0,0,0.45)",
                        color: flashpointYellow,
                      }}
                    >
                      <WorkspacePremiumOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          lineHeight: 1,
                        }}
                      >
                        {roleBadge}
                      </Typography>
                    </Box>

                    {du.training_graduate_badge ? (
                      <Box sx={{ mt: 1.25, display: "flex", justifyContent: "center" }}>
                        <CourseGraduateBadge role={du.training_graduate_badge} />
                      </Box>
                    ) : null}

                    <Typography
                      sx={{ mt: 1.5, color: "rgba(255,255,255,0.62)", fontSize: "0.92rem" }}
                    >
                      {du.email}
                    </Typography>
                    {addressLine ? (
                      <Typography
                        sx={{
                          mt: 0.5,
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.88rem",
                          lineHeight: 1.45,
                          px: 1,
                        }}
                      >
                        {addressLine}
                      </Typography>
                    ) : null}

                    <Box
                      sx={{
                        mt: 2.5,
                        display: "flex",
                        justifyContent: "center",
                        gap: { xs: 4, sm: 5 },
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: flashpointYellow,
                            fontWeight: 800,
                            fontSize: "1.2rem",
                            lineHeight: 1.1,
                          }}
                        >
                          {formatCompactCount(0)}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.85rem" }}>
                          Followers
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            color: flashpointYellow,
                            fontWeight: 800,
                            fontSize: "1.2rem",
                            lineHeight: 1.1,
                          }}
                        >
                          {formatCompactCount(groupsCount)}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.85rem" }}>
                          Groups
                        </Typography>
                      </Box>
                    </Box>

                    {(profile?.phone?.trim() ||
                      du.phone?.trim() ||
                      profile?.date_of_birth ||
                      profile?.gender) && (
                      <Box sx={{ mt: 2.5, textAlign: "left" }}>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.5 }} />
                        {profile?.phone?.trim() || du.phone?.trim() ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Phone: {profile?.phone?.trim() || du.phone?.trim()}
                          </Typography>
                        ) : null}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Date of birth:{" "}
                          {profile?.date_of_birth
                            ? new Date(
                                `${profile.date_of_birth.slice(0, 10)}T12:00:00`
                              ).toLocaleDateString()
                            : "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gender:{" "}
                          {profile?.gender === "male"
                            ? "Male"
                            : profile?.gender === "female"
                              ? "Female"
                              : "—"}
                        </Typography>
                      </Box>
                    )}

                    {du.role_names && du.role_names.length > 1 ? (
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                          justifyContent: "center",
                        }}
                      >
                        {[...du.role_names].sort().map((name) => (
                          <Chip
                            key={name}
                            size="small"
                            label={formatRoleSlug(name)}
                            variant="outlined"
                            sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                          />
                        ))}
                      </Box>
                    ) : null}

                    <Box
                      sx={{
                        mt: 3,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.25,
                      }}
                    >
                      <Button
                        startIcon={<EditOutlinedIcon />}
                        variant="outlined"
                        data-tour="profile-edit-button"
                        onClick={() => setEditMode(true)}
                        sx={{
                          borderColor: flashpointYellow,
                          color: flashpointYellow,
                          py: 1,
                          "&:hover": {
                            borderColor: flashpointYellow,
                            bgcolor: "rgba(255,215,0,0.08)",
                          },
                        }}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        startIcon={<LockOutlinedIcon />}
                        variant="outlined"
                        onClick={() => setPasswordOpen(true)}
                        sx={{
                          borderColor: flashpointYellow,
                          color: flashpointYellow,
                          py: 1,
                          "&:hover": {
                            borderColor: flashpointYellow,
                            bgcolor: "rgba(255,215,0,0.08)",
                          },
                        }}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    component="form"
                    data-tour="profile-edit-form"
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5, textAlign: "left" }}
                  >
                    <Typography sx={{ fontWeight: 700, mb: 0.5, textAlign: "center" }}>
                      Edit profile
                    </Typography>
                    <TextField
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      size="small"
                      fullWidth
                      helperText="Shown in the sidebar and across the app"
                    />
                    <TextField
                      label="Phone (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      size="small"
                      fullWidth
                      autoComplete="tel"
                    />
                    <TextField
                      label="Street address (optional)"
                      value={addrLine}
                      onChange={(e) => setAddrLine(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="City (optional)"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <UsStateSearchAutocomplete
                      valueCode={addrState}
                      onSelectCode={setAddrState}
                      disabled={saving}
                    />
                    <TextField
                      label="ZIP (optional)"
                      value={addrZip}
                      onChange={(e) => setAddrZip(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Date of birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel id="profile-gender-label">Gender</InputLabel>
                      <Select
                        labelId="profile-gender-label"
                        label="Gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
                      >
                        <MenuItem value="">
                          <em>Not set</em>
                        </MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                      </Select>
                    </FormControl>

                    <Divider sx={{ my: 0.5 }} />
                    <Box data-tour="profile-edit-email">
                      <SignInEmailChangePanel
                        key={du.email}
                        currentEmail={du.email}
                        sendOtpUrl="/api/profile/change-email/send-otp"
                        confirmUrl="/api/profile/change-email/confirm"
                        disabled={saving}
                        onSuccess={async () => {
                          const supabase = createClient();
                          await supabase.auth.refreshSession();
                          setEditMode(false);
                          router.refresh();
                        }}
                      />
                    </Box>

                    <Box data-tour="profile-edit-photo">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Profile photo
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          disabled={avatarUploading || saving}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {avatarUploading ? "Uploading…" : "Choose image"}
                        </Button>
                        {avatarUrl.trim() ? (
                          <Button
                            type="button"
                            size="small"
                            color="inherit"
                            disabled={avatarUploading || saving}
                            onClick={() => void clearAvatar()}
                          >
                            Remove photo
                          </Button>
                        ) : null}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                        JPEG, PNG, WebP, or GIF — max 1 MB
                      </Typography>
                    </Box>
                    <Box data-tour="profile-save-actions" sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button variant="contained" disabled={saving} onClick={() => void save()}>
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        variant="text"
                        disabled={saving}
                        onClick={() => {
                          setEditMode(false);
                          void load();
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </Drawer>
  );
}
