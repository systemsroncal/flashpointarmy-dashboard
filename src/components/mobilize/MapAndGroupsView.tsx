"use client";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MOBILIZE_GROUP_TYPES } from "@/lib/mobilize/constants";

const MobilizeMap = dynamic(
  () => import("@/components/mobilize/MobilizeMap").then((m) => ({ default: m.MobilizeMap })),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={420} sx={{ borderRadius: 1 }} /> }
);

type GroupRow = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: string;
  created_at: string;
  distance_km?: number;
};

type SortKey = "name" | "group_type" | "created_at" | "distance_km";
type SortDir = "asc" | "desc";

export function MapAndGroupsView() {
  const router = useRouter();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = [...selectedTypes];
      if (userPos && radiusKm != null && radiusKm > 0) {
        const params = new URLSearchParams({
          lat: String(userPos.lat),
          lng: String(userPos.lng),
          radiusKm: String(radiusKm),
        });
        if (types.length) params.set("types", types.join(","));
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/nearby?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        setGroups((json.groups ?? []) as GroupRow[]);
      } else {
        const params = new URLSearchParams();
        if (types.length) params.set("types", types.join(","));
        if (debouncedSearch) params.set("q", debouncedSearch);
        const res = await fetch(`/api/mobilize/groups?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        setGroups((json.groups ?? []) as GroupRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, radiusKm, selectedTypes, userPos]);

  useEffect(() => {
    void load();
  }, [load]);

  const markers = useMemo(
    () =>
      groups
        .filter((g) => g.latitude != null && g.longitude != null)
        .map((g) => ({
          id: g.id,
          name: g.name,
          group_type: g.group_type,
          description: g.description,
          address_line: g.address_line,
          latitude: g.latitude as number,
          longitude: g.longitude as number,
        })),
    [groups]
  );

  const sortedRows = useMemo(() => {
    const copy = [...groups];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "distance_km") {
        const da = a.distance_km ?? Number.POSITIVE_INFINITY;
        const db = b.distance_km ?? Number.POSITIVE_INFINITY;
        return (da - db) * dir;
      }
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return copy;
  }, [groups, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setToast("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setToast("Location applied for distance filter.");
      },
      () => setToast("Unable to read your location. Check browser permissions."),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Map & Groups
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Discover public Mobilize groups. Use filters to narrow by type, distance, or name. The map uses Mapbox GL via{" "}
        <code>react-map-gl</code> (Horizon UI Map stack).
      </Typography>

      <Card variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
        <CardContent>
          <Stack spacing={2} direction={{ xs: "column", md: "row" }} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="Search name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{ endAdornment: <SearchIcon fontSize="small" color="disabled" /> }}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="radius-label">Distance filter</InputLabel>
              <Select
                labelId="radius-label"
                label="Distance filter"
                value={radiusKm == null ? "" : String(radiusKm)}
                onChange={(e) => {
                  const v = e.target.value;
                  setRadiusKm(v === "" ? null : Number(v));
                }}
              >
                <MenuItem value="">None (show all)</MenuItem>
                <MenuItem value="5">Within 5 km</MenuItem>
                <MenuItem value="10">Within 10 km</MenuItem>
                <MenuItem value="25">Within 25 km</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={requestLocation} disabled={radiusKm == null}>
              Use my location
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create group
            </Button>
          </Stack>
          <FormGroup row sx={{ mt: 2, gap: 1 }}>
            {MOBILIZE_GROUP_TYPES.map((t) => (
              <FormControlLabel
                key={t}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedTypes.has(t)}
                    onChange={(_, checked) => {
                      setSelectedTypes((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(t);
                        else next.delete(t);
                        return next;
                      });
                    }}
                  />
                }
                label={t}
              />
            ))}
          </FormGroup>
        </CardContent>
      </Card>

      <MobilizeMap
        markers={markers}
        mapboxToken={mapboxToken}
        onJoinClick={async (id) => {
          const res = await fetch(`/api/mobilize/groups/${id}/join`, { method: "POST" });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) setToast(String(json.error ?? "Join failed"));
          else setToast("Join request sent (or you are already a member).");
        }}
        onViewDetails={(id) => router.push(`/dashboard/mobilize/groups/${id}`)}
      />

      <Card variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Groups list
          </Typography>
          {loading ? (
            <Skeleton height={240} />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortKey === "name" ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === "name"}
                      direction={sortKey === "name" ? sortDir : "asc"}
                      onClick={() => toggleSort("name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortKey === "group_type" ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === "group_type"}
                      direction={sortKey === "group_type" ? sortDir : "asc"}
                      onClick={() => toggleSort("group_type")}
                    >
                      Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Address</TableCell>
                  {radiusKm != null && userPos ? (
                    <TableCell sortDirection={sortKey === "distance_km" ? sortDir : false}>
                      <TableSortLabel
                        active={sortKey === "distance_km"}
                        direction={sortKey === "distance_km" ? sortDir : "asc"}
                        onClick={() => toggleSort("distance_km")}
                      >
                        Distance (km)
                      </TableSortLabel>
                    </TableCell>
                  ) : null}
                  <TableCell sortDirection={sortKey === "created_at" ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === "created_at"}
                      direction={sortKey === "created_at" ? sortDir : "asc"}
                      onClick={() => toggleSort("created_at")}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.group_type}</TableCell>
                    <TableCell>{g.address_line ?? "—"}</TableCell>
                    {radiusKm != null && userPos ? (
                      <TableCell>
                        {g.distance_km != null ? g.distance_km.toFixed(2) : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => router.push(`/dashboard/mobilize/groups/${g.id}`)}>
                        Details
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          const res = await fetch(`/api/mobilize/groups/${g.id}/join`, { method: "POST" });
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) setToast(String(json.error ?? "Join failed"));
                          else setToast("Join request sent.");
                        }}
                      >
                        Join
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateGroupDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void load()} />

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)} sx={{ width: "100%" }}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function CreateGroupDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState<string>(MOBILIZE_GROUP_TYPES[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [onlyLeadersEvents, setOnlyLeadersEvents] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [hits, setHits] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (address.trim().length < 3) {
        setHits([]);
        return;
      }
      const res = await fetch("/api/mobilize/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: address }),
      });
      const json = await res.json();
      if (res.ok) setHits(json.hits ?? []);
    }, 450);
    return () => clearTimeout(t);
  }, [address, open]);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/mobilize/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          group_type: groupType,
          description,
          address_line: address,
          visibility,
          only_leaders_can_create_events: onlyLeadersEvents,
          latitude: lat,
          longitude: lng,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onCreated();
      onClose();
      setName("");
      setDescription("");
      setAddress("");
      setLat(null);
      setLng(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Mobilize group</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err ? <Alert severity="error">{err}</Alert> : null}
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
          <FormControl fullWidth>
            <InputLabel id="gt">Group type</InputLabel>
            <Select labelId="gt" label="Group type" value={groupType} onChange={(e) => setGroupType(String(e.target.value))}>
              {MOBILIZE_GROUP_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />
          <TextField
            label="Address (autocomplete via geocode)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            helperText="Pick a suggestion to set coordinates."
          />
          {hits.length > 0 ? (
            <Stack spacing={0.5}>
              {hits.map((h) => (
                <Button
                  key={h.displayName + h.lat + h.lng}
                  variant="text"
                  size="small"
                  sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  onClick={() => {
                    setAddress(h.displayName);
                    setLat(h.lat);
                    setLng(h.lng);
                    setHits([]);
                  }}
                >
                  {h.displayName}
                </Button>
              ))}
            </Stack>
          ) : null}
          <FormControl fullWidth>
            <InputLabel id="vis">Visibility</InputLabel>
            <Select
              labelId="vis"
              label="Visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value === "private" ? "private" : "public")}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox checked={onlyLeadersEvents} onChange={(_, v) => setOnlyLeadersEvents(v)} />
            }
            label="Only leaders can create events"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving || name.trim().length < 2} onClick={() => void submit()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
