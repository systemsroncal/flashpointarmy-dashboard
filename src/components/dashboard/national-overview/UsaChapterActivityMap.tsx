"use client";

import { US_STATES_GEO_URL } from "@/lib/maps/us-states-geo";
import { getStateCentroid } from "@/lib/reports/us-city-coordinates";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

import { US_STATES, usStateByCode, usStateById } from "@/data/usStates";

const COLORS = {
  noActivity: "#1c1a1a",
  low: "#676767",
  moderate: "#f1900f",
  high: "#18d018",
  stroke: "rgba(255, 215, 0, 0.35)",
  stateBorder: "#ffffff",
  selected: "#FFD700",
};

const LEGEND_ITEMS = [
  { c: COLORS.noActivity, t: "No activity" },
  { c: COLORS.low, t: "Low (chapters 1–4 or ref. leaders/members)" },
  { c: COLORS.moderate, t: "Moderate (chapters 5–20 or ref. leaders/members)" },
  { c: COLORS.high, t: "High (21+ chapters or strong ref. reach)" },
] as const;

const DEFAULT_MAP_VIEW = { zoom: 1, center: [-98, 38] as [number, number] };

const LARGE_STATES = new Set(["AK", "TX", "CA", "MT", "NM", "AZ", "NV", "OR", "MN", "MI", "WI", "MO", "IL", "GA", "FL", "ME"]);
const SMALL_STATES = new Set(["RI", "DE", "DC", "CT", "NJ", "NH", "VT", "MA", "MD"]);

type MapView = { zoom: number; center: [number, number] };

function zoomForState(code: string): number {
  if (SMALL_STATES.has(code)) return 4;
  if (LARGE_STATES.has(code)) return 2.2;
  return 3;
}

function mapViewForState(code: string): MapView {
  const center = getStateCentroid(code);
  if (!center) return DEFAULT_MAP_VIEW;
  return { zoom: zoomForState(code), center };
}

function geographyToStateCode(geo: {
  id?: string | number;
  properties?: { name?: string };
}): string | null {
  const raw = geo.id;
  if (raw !== undefined && raw !== null) {
    const key = String(raw).padStart(2, "0");
    const byFips = usStateById(key);
    if (byFips) return byFips.code;
  }
  const name = geo.properties?.name;
  if (name) {
    const row = US_STATES.find((s) => s.name === name);
    if (row) return row.code;
  }
  return null;
}

type RsmGeo = {
  rsmKey: string;
  id?: string | number;
  properties?: { name?: string };
  svgPath?: string;
};

type ActivityTier = "none" | "low" | "moderate" | "high";

/** Chapters and reference leaders+members share the same tier thresholds. */
function activityTier(count: number): ActivityTier {
  if (count >= 21) return "high";
  if (count >= 5) return "moderate";
  if (count >= 1) return "low";
  return "none";
}

function colorForTier(tier: ActivityTier): string {
  switch (tier) {
    case "high":
      return COLORS.high;
    case "moderate":
      return COLORS.moderate;
    case "low":
      return COLORS.low;
    default:
      return COLORS.noActivity;
  }
}

export function UsaChapterActivityMap({
  chapterCountByState,
  referenceSplitByState,
  selectedStateCode,
  popupOpen,
  onSelectState,
  onClosePopup,
  children,
}: {
  chapterCountByState: Map<string, number>;
  /** Per state: leaders + members from city file (1 leader + rest members per city), map fill only. */
  referenceSplitByState?: Map<string, { leaders: number; members: number }>;
  selectedStateCode: string | null;
  popupOpen: boolean;
  onSelectState: (stateCode: string) => void;
  onClosePopup: () => void;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapViewRef = useRef<MapView>(DEFAULT_MAP_VIEW);
  const animateFrameRef = useRef<number | null>(null);
  const popupWasOpenRef = useRef(false);
  const [geography, setGeography] = useState<object | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapView, setMapView] = useState<MapView>(DEFAULT_MAP_VIEW);

  useEffect(() => {
    mapViewRef.current = mapView;
  }, [mapView]);

  useEffect(() => {
    return () => {
      if (animateFrameRef.current != null) cancelAnimationFrame(animateFrameRef.current);
    };
  }, []);

  const animateMapView = useCallback((target: MapView, duration = 480) => {
    if (animateFrameRef.current != null) cancelAnimationFrame(animateFrameRef.current);
    const start = mapViewRef.current;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t * (2 - t);
      const next: MapView = {
        zoom: start.zoom + (target.zoom - start.zoom) * ease,
        center: [
          start.center[0] + (target.center[0] - start.center[0]) * ease,
          start.center[1] + (target.center[1] - start.center[1]) * ease,
        ],
      };
      setMapView(next);
      if (t < 1) {
        animateFrameRef.current = requestAnimationFrame(step);
      } else {
        animateFrameRef.current = null;
      }
    };

    animateFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (popupOpen && selectedStateCode) {
      animateMapView(mapViewForState(selectedStateCode));
    } else if (popupWasOpenRef.current && !popupOpen) {
      animateMapView(DEFAULT_MAP_VIEW);
    }
    popupWasOpenRef.current = popupOpen;
  }, [animateMapView, popupOpen, selectedStateCode]);

  useEffect(() => {
    let cancelled = false;
    setGeoError(null);
    void fetch(US_STATES_GEO_URL, { cache: "force-cache" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<object>;
      })
      .then((data) => {
        if (!cancelled) setGeography(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setGeography(null);
          setGeoError(err instanceof Error ? err.message : "Failed to load map data.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMoveEnd = useCallback(
    (pos: { coordinates: [number, number]; zoom: number }) => {
      if (animateFrameRef.current != null) return;
      setMapView({ zoom: pos.zoom, center: pos.coordinates });
    },
    []
  );

  const zoomBy = useCallback((factor: number) => {
    setMapView((v) => ({
      ...v,
      zoom: Math.min(8, Math.max(0.5, v.zoom * factor)),
    }));
  }, []);

  const fillForState = useCallback(
    (code: string | null) => {
      if (!code) return COLORS.noActivity;
      const chapters = chapterCountByState.get(code) ?? 0;
      const ref = referenceSplitByState?.get(code);
      const refTotal = (ref?.leaders ?? 0) + (ref?.members ?? 0);
      const chapterTier = activityTier(chapters);
      const tier = chapterTier !== "none" ? chapterTier : activityTier(refTotal);
      return colorForTier(tier);
    },
    [chapterCountByState, referenceSplitByState]
  );

  const onGeoClick = useCallback(
    (geo: RsmGeo, e: ReactMouseEvent<SVGPathElement>) => {
      e.stopPropagation();
      const code = geographyToStateCode(geo);
      if (!code) return;
      onSelectState(code);
    },
    [onSelectState]
  );

  const selectedStateName = useMemo(() => {
    if (!selectedStateCode) return "";
    return usStateByCode(selectedStateCode)?.name ?? selectedStateCode;
  }, [selectedStateCode]);

  return (
    <Box
      ref={wrapRef}
      sx={{
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid rgba(255, 215, 0, 0.3)",
        bgcolor: "rgba(0,0,0,0.35)",
        minHeight: { xs: 320, sm: 400, md: popupOpen ? 420 : 480 },
        cursor: "default",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: 12,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          bgcolor: "rgba(28,26,26,0.92)",
          border: "1px solid rgba(255, 215, 0, 0.3)",
          borderRadius: 1,
          p: 0.5,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          size="small"
          aria-label="Zoom in"
          onClick={() => zoomBy(1.2)}
          sx={{ color: "primary.main", border: "1px solid rgba(255,215,0,0.3)" }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / 1.2)}
          sx={{ color: "primary.main", border: "1px solid rgba(255,215,0,0.3)" }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          px: 1.5,
          py: 1,
          borderBottom: "1px solid rgba(255,215,0,0.12)",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400" }}>
          Legend
        </Typography>
        {LEGEND_ITEMS.map((item) => (
          <Box key={item.t} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: item.c,
                border: `1px solid ${COLORS.stroke}`,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {item.t}
            </Typography>
          </Box>
        ))}
      </Box>

      {geoError ? (
        <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            Could not load the map. Please refresh the page.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {geoError}
          </Typography>
        </Box>
      ) : !geography ? (
        <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Loading map…
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: popupOpen ? { xs: "column", md: "row" } : "column",
            alignItems: "stretch",
            minHeight: { xs: 280, sm: 360, md: popupOpen ? 380 : 440 },
          }}
        >
          <Box
            sx={{
              flex: popupOpen ? { xs: "1 1 auto", md: "1 1 58%" } : "1 1 auto",
              minWidth: 0,
              position: "relative",
            }}
          >
            <ComposableMap
              projection="geoAlbersUsa"
              width={900}
              height={520}
              projectionConfig={{ scale: 1000 }}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: popupOpen ? "min(62vh, 480px)" : "min(74vh, 520px)",
                display: "block",
                touchAction: "none",
              }}
            >
              <ZoomableGroup
                zoom={mapView.zoom}
                center={mapView.center}
                minZoom={0.5}
                maxZoom={8}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={geography}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const g = geo as RsmGeo;
                      const code = geographyToStateCode(g);
                      const selected = code && code === selectedStateCode;
                      const base = fillForState(code);
                      return (
                        <Geography
                          key={g.rsmKey}
                          geography={geo}
                          onClick={(e) => onGeoClick(g, e)}
                          style={{
                            default: {
                              fill: base,
                              stroke: selected ? COLORS.selected : COLORS.stateBorder,
                              strokeWidth: selected ? 2 : 0.6,
                              outline: "none",
                              cursor: code ? "pointer" : "default",
                              opacity: popupOpen && code && code !== selectedStateCode ? 0.35 : 1,
                            },
                            hover: {
                              fill: code ? base : base,
                              stroke: COLORS.selected,
                              strokeWidth: 2.2,
                              outline: "none",
                              filter: code ? "brightness(1.15)" : undefined,
                              opacity: popupOpen && code && code !== selectedStateCode ? 0.5 : 1,
                            },
                            pressed: {
                              fill: base,
                              stroke: COLORS.selected,
                              strokeWidth: 2.2,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </Box>

          {popupOpen ? (
            <Paper
              elevation={8}
              role="dialog"
              aria-modal="true"
              sx={{
                flex: { xs: "0 0 auto", md: "0 0 300px" },
                width: { xs: "100%", md: 300 },
                m: { xs: 1.5, md: 1.5 },
                mt: { xs: 0, md: 1.5 },
                p: 2,
                bgcolor: "rgba(28,26,26,0.95)",
                border: "1px solid rgba(255, 215, 0, 0.35)",
                color: "grey.100",
                alignSelf: { md: "stretch" },
                display: "flex",
                flexDirection: "column",
                maxHeight: { xs: "none", md: "min(62vh, 480px)" },
                overflow: "auto",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.2 }}>
                    {selectedStateName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedStateCode}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={onClosePopup}
                  aria-label="Close"
                  sx={{ color: "grey.400", mt: -0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              {children}
            </Paper>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
