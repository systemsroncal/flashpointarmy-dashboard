"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
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

const TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
    const t = setTimeout(() => map.invalidateSize(), 200);
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

type Props = {
  markers: MapMarkerPoint[];
  height?: string | number;
  center?: [number, number];
  zoom?: number;
};

/**
 * Mobilize map: Leaflet + MarkerClusterGroup. Horizon UI Map is a commercial template component
 * not shipped in this repo; this matches the same UX (markers, popups, clustering, OSM tiles).
 */
export default function MobilizeMapView({ markers, height = 420, center, zoom = 4 }: Props) {
  const defaultCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [39.8283, -98.5795];
  }, [center, markers]);

  return (
    <Box sx={{ width: "100%", height, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,215,0,0.15)" }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer attribution={ATTR} url={TILE} />
        <InvalidateSize />
        <ClusterLayer markers={markers} />
      </MapContainer>
      {markers.length === 0 ? (
        <Box sx={{ mt: -6, textAlign: "center", pointerEvents: "none" }}>
          <Typography variant="caption" color="text.secondary">
            No markers in the current filter.
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
