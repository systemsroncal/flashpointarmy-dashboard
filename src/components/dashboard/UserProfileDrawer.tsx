"use client";

import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { validateAvatarFile } from "@/lib/upload/validate-image";
import { UsStateSearchAutocomplete } from "@/components/forms/UsStateSearchAutocomplete";
import { usStateByCode } from "@/data/usStates";
import { createClient } from "@/utils/supabase/client";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
};

function formatStateForDisplay(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  const u = usStateByCode(c);
  return u ? `${u.name} (${u.code})` : c;
}

export function UserProfileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const du = useDashboardUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarNonce, setAvatarNonce] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: qErr } = await supabase
      .from("profiles")
      .select("first_name, last_name, display_name, avatar_url, phone, address_line, city, state, zip_code")
      .eq("id", du.id)
      .maybeSingle();
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
    setAvatarUrl(row?.avatar_url ?? "");
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

  const initial =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    du.display_name ||
    du.email.split("@")[0];
  const avatarSrc = avatarUrl.trim()
    ? `${publicAssetSrc(avatarUrl.trim())}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarNonce || "1"}`
    : undefined;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 380 }, maxWidth: "100vw" } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonOutlineIcon color="primary" />
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
            Profile
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
              <Avatar
                src={avatarSrc}
                sx={{ width: 96, height: 96, mb: 1, bgcolor: "primary.dark", fontSize: "2rem" }}
              >
                {initial.slice(0, 2).toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {du.email}
              </Typography>
            </Box>

            {error ? (
              <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                {error}
              </Typography>
            ) : null}

            {!editMode ? (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {initial}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {[profile?.first_name ?? du.first_name, profile?.last_name ?? du.last_name]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </Typography>
                {profile?.phone?.trim() || du.phone?.trim() ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {profile?.phone?.trim() || du.phone?.trim()}
                  </Typography>
                ) : null}
                {profile?.address_line?.trim() ||
                profile?.city?.trim() ||
                profile?.state?.trim() ||
                profile?.zip_code?.trim() ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {[
                      profile?.address_line?.trim(),
                      profile?.city?.trim(),
                      formatStateForDisplay(profile?.state),
                      profile?.zip_code?.trim(),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Typography>
                ) : null}
                <Button
                  startIcon={<EditOutlinedIcon />}
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => setEditMode(true)}
                >
                  Edit profile
                </Button>
              </>
            ) : (
              <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Profile photo (JPEG, PNG, WebP, or GIF — max 1 MB)
                  </Typography>
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
                </Box>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
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
          </>
        )}
      </Box>
    </Drawer>
  );
}
