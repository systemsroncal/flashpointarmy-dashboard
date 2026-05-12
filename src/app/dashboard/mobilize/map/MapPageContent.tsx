"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";
import { canCreateMobilizeGroup } from "@/lib/mobilize/mobilize-roles";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { useMobilizeToast } from "@/components/mobilize/MobilizeToastProvider";

const MobilizeMapView = dynamic(() => import("@/components/mobilize/MobilizeMapView"), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={440} sx={{ borderRadius: 2 }} />,
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
};

type OriginMode = "gps" | "address";

export default function MobilizeMapPageContent() {
  const toast = useMobilizeToast();
  const dashboardUser = useDashboardUser();
  const canCreateGroup = canCreateMobilizeGroup(dashboardUser.role_names);
  const [originMode, setOriginMode] = useState<OriginMode>("address");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [manualSearchAddress, setManualSearchAddress] = useState("");
  const [manualPos, setManualPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sort, setSort] = useState<"name" | "distance">("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    group_type: "reading",
    description: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: "public",
  });

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
      if (searchOrigin) {
        const params = new URLSearchParams({
          lat: String(searchOrigin.lat),
          lng: String(searchOrigin.lng),
          radiusKm: String(radiusKm),
        });
        if (types.length) params.set("types", types.join(","));
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/nearby?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load nearby groups.");
        setGroups(json.groups ?? []);
      } else {
        const params = new URLSearchParams({ visibility: "public" });
        if (types.length) params.set("types", types.join(","));
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/groups?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load groups.");
        let rows = (json.groups ?? []).filter(
          (g: GroupRow) => g.latitude != null && g.longitude != null
        ) as GroupRow[];
        const resMine = await fetch("/api/mobilize/my-groups");
        const jsonMine = await resMine.json();
        if (resMine.ok && Array.isArray(jsonMine.groups)) {
          const byId = new Map(rows.map((g) => [g.id, g]));
          for (const raw of jsonMine.groups as GroupRow[]) {
            if (raw.latitude == null || raw.longitude == null) continue;
            if (!byId.has(raw.id)) byId.set(raw.id, raw);
          }
          rows = [...byId.values()];
        }
        setGroups(rows);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Load failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchOrigin, radiusKm, types, debouncedSearch, toast]);

  useEffect(() => {
    void load();
  }, [load]);

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
      toast("Dirección localizada. El mapa usará este punto mientras tengas «Usar dirección» seleccionado.", "success");
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
          subtitle: `${g.group_type} · ${g.address ?? "No address"}`,
          href: `/dashboard/mobilize/groups/${g.id}`,
        })),
    [sorted]
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
        ? "Tu ubicación (GPS)"
        : (manualSearchAddress.trim() || "Punto por dirección");
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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed.");
      toast("Group created.", "success");
      setCreateOpen(false);
      setForm({
        name: "",
        group_type: "reading",
        description: "",
        address: "",
        latitude: null,
        longitude: null,
        visibility: "public",
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
            Map & Groups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Public groups and your own groups with coordinates. Use GPS or type an address and geocode it to search
            nearby (server-side Haversine). Only admins, super admins, and local leaders can create a group.
          </Typography>
        </Box>
        {canCreateGroup ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New group
          </Button>
        ) : null}
      </Stack>

      <FormControl component="fieldset" variant="standard" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.875rem", mb: 0.5 }}>
          Punto de búsqueda (mapa y radio)
        </FormLabel>
        <RadioGroup
          row
          value={originMode}
          onChange={(_, v) => setOriginMode(v as OriginMode)}
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          <FormControlLabel value="gps" control={<Radio size="small" color="warning" />} label="Usar GPS" />
          <FormControlLabel
            value="address"
            control={<Radio size="small" color="warning" />}
            label="Usar dirección (teclear y geocodificar)"
          />
        </RadioGroup>
        {originMode === "gps" && !userPos ? (
          <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
            Sin GPS aún: permite la ubicación en el navegador o elige «Usar dirección» y pulsa «Usar este punto».
          </Typography>
        ) : null}
        {originMode === "address" && !manualPos ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Escribe una dirección y pulsa «Usar este punto» para fijar el muñequito y el círculo de radio ahí.
          </Typography>
        ) : null}
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "flex-start" }}>
        <TextField
          label="Mi dirección"
          size="small"
          fullWidth
          sx={{ flex: 1, minWidth: 220 }}
          value={manualSearchAddress}
          onChange={(e) => setManualSearchAddress(e.target.value)}
          placeholder="Calle, ciudad, estado…"
          disabled={originMode === "gps"}
        />
        <Button variant="outlined" onClick={() => void geocodeManualSearchAddress()} disabled={originMode === "gps"}>
          Usar este punto
        </Button>
        {manualPos && originMode === "address" ? (
          <Button
            size="small"
            color="warning"
            onClick={() => {
              setManualPos(null);
              setManualSearchAddress("");
            }}
          >
            Quitar punto
          </Button>
        ) : null}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField
          label="Search name"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="radius-label">Radius (km)</InputLabel>
          <Select
            labelId="radius-label"
            label="Radius (km)"
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ width: "100%", md: "auto" }}>
            Types
          </Typography>
          {MOBILIZE_GROUP_TYPES.map((t) => (
            <FormControlLabel
              key={t}
              control={
                <Checkbox
                  size="small"
                  checked={types.includes(t)}
                  onChange={() =>
                    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                />
              }
              label={t}
            />
          ))}
        </Box>
      </Stack>

      {!searchOrigin ? (
        <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 1 }}>
          {originMode === "gps"
            ? "Sin punto GPS: permite la ubicación o cambia a «Usar dirección» y geocodifica."
            : "Sin punto por dirección: geocodifica con «Usar este punto» o cambia a «Usar GPS»."}
        </Typography>
      ) : null}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="stretch">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MobilizeMapView
            markers={markers}
            height={440}
            center={mapCenter}
            zoom={searchOrigin ? 9 : 4}
            searchOrigin={mapSearchOrigin}
          />
        </Box>
        <Box sx={{ width: { xs: "100%", lg: 360 }, flexShrink: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Groups ({sorted.length})
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={360} />
          ) : (
            <List dense sx={{ bgcolor: "rgba(0,0,0,0.2)", borderRadius: 1, maxHeight: 440, overflow: "auto" }}>
              {sorted.map((g) => (
                <ListItemButton key={g.id} component={Link} href={`/dashboard/mobilize/groups/${g.id}`}>
                  <ListItemText
                    primary={g.name}
                    secondary={
                      <>
                        {g.group_type}
                        {g.distance_km != null ? ` · ${g.distance_km.toFixed(1)} km` : null}
                        <br />
                        {g.address ?? "—"}
                      </>
                    }
                  />
                </ListItemButton>
              ))}
              {!sorted.length ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No groups match your filters.
                  </Typography>
                </Box>
              ) : null}
            </List>
          )}
        </Box>
      </Stack>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create group</DialogTitle>
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
            <TextField
              label="Address (free text)"
              fullWidth
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Button variant="outlined" onClick={() => void runGeocodeForForm()}>
              Geocode address
            </Button>
            <FormControl fullWidth>
              <InputLabel id="vis">Visibility</InputLabel>
              <Select
                labelId="vis"
                label="Visibility"
                value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: String(e.target.value) }))}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={saving}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
