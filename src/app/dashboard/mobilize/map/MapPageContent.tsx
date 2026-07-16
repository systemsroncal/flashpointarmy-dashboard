"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import MobilizeGroupCoverDropzone from "@/components/mobilize/MobilizeGroupCoverDropzone";
import MobilizeGroupListedSwitch from "@/components/mobilize/MobilizeGroupListedSwitch";
import MobilizeGroupsBrowseTable from "@/components/mobilize/MobilizeGroupsBrowseTable";
import type { MobilizeGroupLeaderBrief } from "@/lib/mobilize/enrich-groups-browse";
import type { MobilizeSubgroupBrief } from "@/lib/mobilize/chapter-subgroup";
import { MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import {
  isMobilizeGroupListed,
  mobilizeGroupListingVisibilityFromListed,
} from "@/lib/mobilize/group-ui-labels";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

const MobilizeMapView = dynamic(() => import("@/components/mobilize/MobilizeMapView"), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 2 }} />,
});

type GroupRow = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: string;
  distance_km?: number;
  cover_image_url?: string | null;
  member_count?: number;
  leader_names?: string[];
  leaders?: MobilizeGroupLeaderBrief[];
  upcoming_activity_count?: number;
  my_membership_status?: string | null;
  subgroups?: MobilizeSubgroupBrief[];
  subgroup_count?: number;
  profile_image_url?: string | null;
  parent_group_id?: string | null;
  parent_chapter_name?: string | null;
};

type BrowseTab = "chapters" | "groups";

/** Temporarily hide GPS/address search origin controls on the chapters map page. */
const SHOW_SEARCH_ORIGIN = false;

type OriginMode = "gps" | "address";

export default function MobilizeMapPageContent() {
  const toast = useMobilizeToast();
  const dashboardUser = useDashboardUser();
  const [canCreateGroup, setCanCreateGroup] = useState(false);
  const [originMode, setOriginMode] = useState<OriginMode>("address");
  const [browseTab, setBrowseTab] = useState<BrowseTab>("chapters");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [manualSearchAddress, setManualSearchAddress] = useState("");
  const [manualPos, setManualPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sort, setSort] = useState<"name" | "distance">("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recenterNonce, setRecenterNonce] = useState(0);

  const [form, setForm] = useState({
    name: "",
    group_type: "reading",
    description: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: "public",
    cover_image_url: "",
    wall_post_policy: "all_approved" as "all_approved" | "leaders_only",
    resources_post_policy: "all_approved" as "all_approved" | "leaders_only",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/can-create-group");
        const j = (await res.json()) as { canCreate?: boolean };
        if (!cancelled && res.ok) setCanCreateGroup(Boolean(j.canCreate));
      } catch {
        if (!cancelled) setCanCreateGroup(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dashboardUser.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* user denied or unavailable */
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 }
    );
  }, []);

  const searchOrigin = useMemo(() => {
    if (originMode === "gps") return userPos ?? null;
    return manualPos ?? null;
  }, [originMode, userPos, manualPos]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const scope = browseTab === "groups" ? "subgroups" : "chapters";
      if (searchOrigin) {
        const params = new URLSearchParams({
          lat: String(searchOrigin.lat),
          lng: String(searchOrigin.lng),
          radiusKm: String(radiusKm),
          scope,
        });
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/nearby?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load nearby items.");
        setGroups(json.groups ?? []);
      } else {
        const params = new URLSearchParams({ visibility: "public", scope });
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/groups?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load list.");
        const rows = (json.groups ?? []).filter(
          (g: GroupRow) => g.latitude != null && g.longitude != null
        ) as GroupRow[];
        if (browseTab === "chapters") {
          const resMine = await fetch("/api/mobilize/my-groups");
          const jsonMine = await resMine.json();
          if (resMine.ok && Array.isArray(jsonMine.groups)) {
            const byId = new Map(rows.map((g) => [g.id, g]));
            for (const raw of jsonMine.groups as GroupRow[]) {
              if (raw.parent_group_id != null) continue;
              if (raw.latitude == null || raw.longitude == null) continue;
              if (!isMobilizeGroupListed(raw.visibility)) continue;
              const merged = { ...raw, ...(byId.get(raw.id) ?? {}) };
              byId.set(raw.id, merged);
            }
            setGroups([...byId.values()]);
            return;
          }
        }
        setGroups(rows);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Load failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchOrigin, radiusKm, debouncedSearch, toast, browseTab]);

  useEffect(() => {
    void load();
  }, [load]);

  /** After GPS / address point or radius changes, nudge Leaflet to refit the search circle once layout has settled. */
  useEffect(() => {
    if (!searchOrigin) return;
    const t = window.setTimeout(() => setRecenterNonce((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [searchOrigin?.lat, searchOrigin?.lng, radiusKm]);

  async function geocodeManualSearchAddress() {
    const q = manualSearchAddress.trim();
    if (q.length < 3) {
      toast("Enter at least 3 characters to search your address.", "info");
      return;
    }
    try {
      const res = await fetch("/api/mobilize/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Geocode failed.");
      const hit = json.results?.[0];
      if (!hit) {
        toast("No results for that address.", "info");
        return;
      }
      setManualPos({ lat: hit.lat, lng: hit.lon });
      setManualSearchAddress(hit.display_name);
      setRecenterNonce((n) => n + 1);
      toast("Address located. Map zoomed to your search radius.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Geocode error.", "error");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...groups];
    if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else copy.sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    return copy;
  }, [groups, sort]);

  const markers = useMemo(
    () =>
      sorted
        .filter((g) => g.latitude != null && g.longitude != null)
        .map((g) => ({
          id: g.id,
          lat: g.latitude as number,
          lng: g.longitude as number,
          title: g.name,
          subtitle:
            browseTab === "groups"
              ? `${g.parent_chapter_name ?? "Group"} · ${g.group_type}`
              : `${g.group_type} · ${g.address ?? "No address"}`,
          href:
            browseTab === "groups"
              ? `/dashboard/mobilize/groups/${g.id}`
              : `/dashboard/mobilize/groups/${g.id}/groups`,
        })),
    [sorted, browseTab]
  );

  const mapCenter = useMemo(() => {
    if (searchOrigin) return [searchOrigin.lat, searchOrigin.lng] as [number, number];
    if (markers[0]) return [markers[0].lat, markers[0].lng] as [number, number];
    return undefined;
  }, [searchOrigin, markers]);

  const mapSearchOrigin = useMemo(() => {
    if (!searchOrigin) return null;
    const label =
      originMode === "gps"
        ? "Your location (GPS)"
        : (manualSearchAddress.trim() || "Address search point");
    return { lat: searchOrigin.lat, lng: searchOrigin.lng, radiusKm, label };
  }, [searchOrigin, radiusKm, originMode, manualSearchAddress]);

  async function runGeocodeForForm() {
    const q = form.address.trim();
    if (q.length < 3) {
      toast("Enter a longer address to geocode.", "info");
      return;
    }
    try {
      const res = await fetch("/api/mobilize/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Geocode failed.");
      const hit = json.results?.[0];
      if (!hit) {
        toast("No geocode results.", "info");
        return;
      }
      setForm((f) => ({
        ...f,
        address: hit.display_name,
        latitude: hit.lat,
        longitude: hit.lon,
      }));
      toast("Address geocoded.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Geocode error.", "error");
    }
  }

  async function submitCreate() {
    if (!form.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const cover =
        form.cover_image_url.trim() ? form.cover_image_url.trim() : null;
      const res = await fetch("/api/mobilize/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          group_type: form.group_type,
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          latitude: form.latitude,
          longitude: form.longitude,
          visibility: form.visibility,
          cover_image_url: cover,
          wall_post_policy: form.wall_post_policy,
          resources_post_policy: form.resources_post_policy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed.");
      toast("Chapter created.", "success");
      setCreateOpen(false);
      setForm({
        name: "",
        group_type: "reading",
        description: "",
        address: "",
        latitude: null,
        longitude: null,
        visibility: "public",
        cover_image_url: "",
        wall_post_policy: "all_approved",
        resources_post_policy: "all_approved",
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Create failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Chapters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.55 }}>
            Find FlashPoint Army chapters and groups near you. Browse the map, open a chapter to explore its groups, or
            jump directly into a group feed.
          </Typography>
        </Box>
        {canCreateGroup ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ minWidth: 200 }}
          >
            New chapter
          </Button>
        ) : null}
      </Stack>

      <MobilizeContentPanel>
      <Tabs
        value={browseTab}
        onChange={(_, v: BrowseTab) => setBrowseTab(v)}
        sx={{ mb: 2, minHeight: 40 }}
      >
        <Tab value="chapters" label="Chapters" sx={{ textTransform: "none", fontWeight: 700, minHeight: 40 }} />
        <Tab value="groups" label="Groups" sx={{ textTransform: "none", fontWeight: 700, minHeight: 40 }} />
      </Tabs>
      {SHOW_SEARCH_ORIGIN ? (
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ lg: "center" }}>
        <ToggleButtonGroup
          size="small"
          value={originMode}
          exclusive
          onChange={(_, v) => v && setOriginMode(v as OriginMode)}
          aria-label="Search origin"
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="gps">GPS</ToggleButton>
          <ToggleButton value="address">Address</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          fullWidth
          sx={{ flex: 1, minWidth: { xs: "100%", lg: 200 } }}
          value={manualSearchAddress}
          onChange={(e) => setManualSearchAddress(e.target.value)}
          placeholder={originMode === "gps" ? "Using your location" : "Street, city, state…"}
          disabled={originMode === "gps"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && originMode === "address") void geocodeManualSearchAddress();
          }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => void geocodeManualSearchAddress()}
          disabled={originMode === "gps"}
          sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Use this point
        </Button>
        {manualPos && originMode === "address" ? (
          <Button
            size="small"
            color="warning"
            onClick={() => {
              setManualPos(null);
              setManualSearchAddress("");
            }}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        ) : null}
        <FormControl size="small" sx={{ minWidth: 110, flexShrink: 0 }}>
          <InputLabel id="radius-label">Radius</InputLabel>
          <Select
            labelId="radius-label"
            label="Radius"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            disabled={!searchOrigin}
          >
            {[5, 10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n} km
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      ) : null}

      {SHOW_SEARCH_ORIGIN && originMode === "gps" && !userPos ? (
        <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2, mt: -1 }}>
          Allow browser location or switch to Address and set a point.
        </Typography>
      ) : null}
      {SHOW_SEARCH_ORIGIN && originMode === "address" && !manualPos ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, mt: -1 }}>
          Enter an address and tap Use this point to search nearby chapters.
        </Typography>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField
          label="Search name"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "distance")}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="distance" disabled={!searchOrigin}>
              Distance
            </MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "11fr 9fr" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {browseTab === "groups" ? `Groups (${sorted.length})` : `Chapters (${sorted.length})`}
          </Typography>
          <MobilizeGroupsBrowseTable
            groups={sorted}
            loading={loading}
            maxHeight={480}
            emptyMessage={
              browseTab === "groups" ? "No groups match your filters." : "No chapters match your filters."
            }
            layoutVariant={browseTab === "groups" ? "subgroupsMap" : "mapStacked"}
            nameLinkTarget={browseTab === "groups" ? "group-detail" : "chapter-groups"}
            thumbnailScale={1}
          />
        </Box>
        <Box sx={{ minWidth: 0, position: "relative" }}>
          {searchOrigin ? (
            <Tooltip title="Zoom to search origin (GPS or address)">
              <IconButton
                size="small"
                onClick={() => setRecenterNonce((n) => n + 1)}
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 1000,
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "primary.light",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
                aria-label="Zoom to search origin"
              >
                <MyLocationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <MobilizeMapView
            markers={markers}
            height={480}
            center={mapCenter}
            zoom={searchOrigin ? 9 : 4}
            searchOrigin={mapSearchOrigin}
            recenterNonce={recenterNonce}
          />
        </Box>
      </Box>
      </MobilizeContentPanel>

      <MobilizeDialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create chapter</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="gt">Type</InputLabel>
              <Select
                labelId="gt"
                label="Type"
                value={form.group_type}
                onChange={(e) => setForm((f) => ({ ...f, group_type: String(e.target.value) }))}
              >
                {MOBILIZE_GROUP_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <MobilizeGroupCoverDropzone
              value={form.cover_image_url}
              onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
              disabled={saving}
            />
            <TextField
              label="Address (free text)"
              fullWidth
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Button variant="outlined" onClick={() => void runGeocodeForForm()}>
              Geocode address
            </Button>
            <MobilizeGroupListedSwitch
              listed={isMobilizeGroupListed(form.visibility)}
              disabled={saving}
              onListedChange={(listed) =>
                setForm((f) => ({
                  ...f,
                  visibility: mobilizeGroupListingVisibilityFromListed(listed),
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={saving}>
            Create chapter
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </Box>
  );
}
