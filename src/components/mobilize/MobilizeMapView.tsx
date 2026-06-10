"use client";

import { useEffect, useMemo, useRef } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Box, Typography } from "@mui/material";

export type MapMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  href: string;
};

/** Search origin (GPS or geocoded address) + radius in km for halo and zoom. */
export type MapSearchOrigin = {
  lat: number;
  lng: number;
  radiusKm: number;
  /** Short label for popup (e.g. GPS or address). */
  label: string;
};

const TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const GOLD = "#FFD700";
const GOLD_STROKE = "rgba(255, 236, 179, 0.85)";

function fixDefaultIcons() {
  const icon = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
  delete icon._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        map.invalidateSize(false);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFitSearchCircle(map: L.Map, origin: MapSearchOrigin) {
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return;
  const km = Math.max(Number(origin.radiusKm) || 1, 1);
  const radiusM = km * 1000;
  /** Tighter radius → allow closer max zoom so the search circle fills the pane. */
  const maxZoom = km <= 10 ? 16 : km <= 25 ? 15 : km <= 50 ? 14 : 13;
  try {
    const circle = L.circle([origin.lat, origin.lng], { radius: radiusM });
    const b = circle.getBounds().pad(0.1);
    const size = map.getSize();
    if (size.x < 2 || size.y < 2) return;
    map.fitBounds(b, { padding: [40, 40], maxZoom, animate: true });
  } catch {
    /* container has no size or invalid bounds */
  }
}

/** Fit map to search-radius circle; without origin, use fallback center/zoom. */
function FitSearchRadiusView({
  searchOrigin,
  fallbackCenter,
  fallbackZoom,
}: {
  searchOrigin: MapSearchOrigin | null | undefined;
  fallbackCenter: [number, number];
  fallbackZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!searchOrigin) return;
    /** Leaflet often has 0×0 or stale size right after mount / flex layout; invalidate and refit several times. */
    const run = () => {
      try {
        map.invalidateSize(false);
      } catch {
        /* ignore */
      }
      safeFitSearchCircle(map, searchOrigin);
    };
    const timers = [0, 160, 360, 700, 1100].map((ms) => window.setTimeout(run, ms));
    return () => timers.forEach((id) => clearTimeout(id));
  }, [map, searchOrigin?.lat, searchOrigin?.lng, searchOrigin?.radiusKm, searchOrigin]);

  useEffect(() => {
    if (searchOrigin) return;
    const t = window.setTimeout(() => {
      try {
        const size = map.getSize();
        if (size.x < 2 || size.y < 2) return;
        if (!Number.isFinite(fallbackCenter[0]) || !Number.isFinite(fallbackCenter[1])) return;
        map.setView(fallbackCenter, fallbackZoom, { animate: true });
      } catch {
        /* ignore */
      }
    }, 80);
    return () => clearTimeout(t);
  }, [map, searchOrigin, fallbackCenter, fallbackZoom]);

  return null;
}

function RecenterOnCue({
  searchOrigin,
  recenterNonce,
}: {
  searchOrigin: MapSearchOrigin | null | undefined;
  recenterNonce?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!searchOrigin || !recenterNonce) return;
    const run = () => {
      try {
        map.invalidateSize(false);
      } catch {
        /* ignore */
      }
      safeFitSearchCircle(map, searchOrigin);
    };
    /** Same pattern as initial fit: map size may be stale until after layout. */
    const timers = [0, 40, 120, 280, 520, 900].map((ms) => window.setTimeout(run, ms));
    return () => timers.forEach((id) => clearTimeout(id));
  }, [map, recenterNonce, searchOrigin?.lat, searchOrigin?.lng, searchOrigin?.radiusKm, searchOrigin]);
  return null;
}

function ClusterLayer({ markers }: { markers: MapMarkerPoint[] }) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    fixDefaultIcons();
  }, []);

  useEffect(() => {
    if (groupRef.current) {
      map.removeLayer(groupRef.current);
      groupRef.current.clearLayers();
      groupRef.current = null;
    }
    const mcg = (L as unknown as { markerClusterGroup: (opts?: object) => L.MarkerClusterGroup }).markerClusterGroup({
      chunkedLoading: true,
    });
    for (const m of markers) {
      const mk = L.marker([m.lat, m.lng]);
      const el = document.createElement("div");
      el.innerHTML = `<div style="min-width:200px;font-family:system-ui,sans-serif">
        <strong>${escapeHtml(m.title)}</strong><br/>
        <span style="font-size:12px;opacity:.9">${escapeHtml(m.subtitle)}</span><br/>
        <a href="${m.href}" style="display:inline-block;margin-top:8px;font-weight:600">View details</a>
      </div>`;
      mk.bindPopup(el, { maxWidth: 280 });
      mcg.addLayer(mk);
    }
    map.addLayer(mcg);
    groupRef.current = mcg;
    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
        groupRef.current.clearLayers();
        groupRef.current = null;
      }
    };
  }, [map, markers]);

  return null;
}

const personDivIcon = () =>
  L.divIcon({
    className: "mobilize-person-marker-wrap",
    html: `<div class="mobilize-person-marker-inner" role="img" aria-label="Your search location">
      <span class="mobilize-person-emoji">🧍</span>
    </div>`,
    iconSize: [48, 52],
    iconAnchor: [24, 52],
  });

function SearchRadiusHalos({ origin }: { origin: MapSearchOrigin }) {
  const km = Math.max(Number(origin.radiusKm) || 1, 1);
  const radiusM = km * 1000;
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null;
  const center: [number, number] = [origin.lat, origin.lng];
  return (
    <>
      <Circle
        center={center}
        radius={radiusM * 1.14}
        pathOptions={{
          color: GOLD_STROKE,
          weight: 1.5,
          opacity: 0.55,
          dashArray: "10 14",
          lineCap: "round",
          fillColor: GOLD,
          fillOpacity: 0.04,
        }}
      />
      <Circle
        center={center}
        radius={radiusM}
        pathOptions={{
          color: GOLD,
          weight: 2,
          opacity: 0.9,
          fillColor: GOLD,
          fillOpacity: 0.1,
        }}
      />
    </>
  );
}

function SearchPersonMarker({ origin }: { origin: MapSearchOrigin }) {
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null;
  const center: [number, number] = [origin.lat, origin.lng];
  const icon = useMemo(() => personDivIcon(), []);
  const km = Math.max(Number(origin.radiusKm) || 1, 1);
  const safeLabel = escapeHtml(origin.label || "");
  const popupHtml = `<div style="min-width:180px;font-family:system-ui,sans-serif">
    <strong>Search origin</strong>
    <div style="margin-top:6px;font-size:14px">${safeLabel}</div>
    <div style="margin-top:10px;font-size:12px;opacity:0.75">Approx. radius: ${km} km</div>
  </div>`;
  return (
    <Marker position={center} icon={icon} zIndexOffset={2500}>
      <Popup>{/* Plain HTML: avoids MUI inside Leaflet popup portal (client / React 19 issues). */}
        <div dangerouslySetInnerHTML={{ __html: popupHtml }} />
      </Popup>
    </Marker>
  );
}

type Props = {
  markers: MapMarkerPoint[];
  height?: string | number;
  center?: [number, number];
  zoom?: number;
  /** When set, draws the person marker, radius circles, and fits the map to the search area. */
  searchOrigin?: MapSearchOrigin | null;
  /** Increment (e.g. from a "recenter" control) to re-fit the map to the search origin circle. */
  recenterNonce?: number;
};

/**
 * Mobilize map: Leaflet + MarkerClusterGroup. With `searchOrigin`, shows a person marker,
 * radius circles, and fits the map to the search area.
 */
export default function MobilizeMapView({
  markers,
  height = 420,
  center,
  zoom = 4,
  searchOrigin,
  recenterNonce = 0,
}: Props) {
  const defaultCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [39.8283, -98.5795];
  }, [center, markers]);

  const initialZoom = searchOrigin ? 11 : zoom;

  return (
    <Box sx={{ width: "100%", height, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)" }}>
      <MapContainer
        center={defaultCenter}
        zoom={initialZoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer attribution={ATTR} url={TILE} />
        <InvalidateSize />
        {searchOrigin ? <SearchRadiusHalos origin={searchOrigin} /> : null}
        <FitSearchRadiusView
          searchOrigin={searchOrigin}
          fallbackCenter={defaultCenter}
          fallbackZoom={zoom}
        />
        {searchOrigin ? <RecenterOnCue searchOrigin={searchOrigin} recenterNonce={recenterNonce} /> : null}
        <ClusterLayer markers={markers} />
        {searchOrigin ? <SearchPersonMarker origin={searchOrigin} /> : null}
      </MapContainer>
      {markers.length === 0 ? (
        <Box sx={{ mt: -6, textAlign: "center", pointerEvents: "none" }}>
          <Typography variant="caption" color="text.secondary">
            {searchOrigin
              ? "No groups in this radius. Try a larger radius (km) or a different search origin."
              : "No markers in the current filter."}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
