"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

import { US_STATES, usStateById } from "@/data/usStates";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const COLORS = {
  noChapters: "#1c1a1a",
  hasChapters: "#1b5e20",
  hasChaptersMid: "#2e7d32",
  stroke: "rgba(255, 215, 0, 0.35)",
  selected: "#FFD700",
};

type MapView = { zoom: number; center: [number, number] };

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

/** Visual-only thresholds: reference leaders+members (from city JSON) layer onto map fill. */
const REFERENCE_TIER_MID = 15;
const REFERENCE_TIER_HIGH = 150;

export function UsaChapterActivityMap({
  chapterCountByState,
  referenceSplitByState,
  selectedStateCode,
  popupOpen,
  popupAnchor,
  onSelectState,
  onClosePopup,
  children,
}: {
  chapterCountByState: Map<string, number>;
  /** Per state: leaders + members from city file (1 leader + rest members per city), map fill only. */
  referenceSplitByState?: Map<string, { leaders: number; members: number }>;
  selectedStateCode: string | null;
  popupOpen: boolean;
  popupAnchor: { x: number; y: number } | null;
  onSelectState: (stateCode: string, anchor: { x: number; y: number }) => void;
  onClosePopup: () => void;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<MapView>({
    zoom: 1,
    center: [-98, 38] as [number, number],
  });

  const handleMoveEnd = useCallback(
    (pos: { coordinates: [number, number]; zoom: number }) => {
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
      if (!code) return COLORS.noChapters;
      const chapters = chapterCountByState.get(code) ?? 0;
      const ref = referenceSplitByState?.get(code);
      const refLeaders = ref?.leaders ?? 0;
      const refMembers = ref?.members ?? 0;
      const refTotal = refLeaders + refMembers;
      if (chapters <= 0 && refTotal <= 0) return COLORS.noChapters;
      if (chapters >= 5 || refTotal >= REFERENCE_TIER_HIGH) return COLORS.hasChapters;
      if (chapters >= 1 || refTotal >= REFERENCE_TIER_MID) return COLORS.hasChaptersMid;
      return COLORS.hasChaptersMid;
    },
    [chapterCountByState, referenceSplitByState]
  );

  const onGeoClick = useCallback(
    (geo: RsmGeo, e: ReactMouseEvent<SVGPathElement>) => {
      e.stopPropagation();
      const code = geographyToStateCode(geo);
      if (!code) return;
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      onSelectState(code, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [onSelectState]
  );

  const popupStyle = useMemo(() => {
    if (!popupOpen || !popupAnchor || !wrapRef.current) {
      return { display: "none" as const };
    }
    const rect = wrapRef.current.getBoundingClientRect();
    const pw = 240;
    const ph = 320;
    const offset = 16;
    let left = popupAnchor.x + offset;
    let top = popupAnchor.y + offset;
    if (left + pw > rect.width) left = popupAnchor.x - pw - offset;
    if (top + ph > rect.height) top = popupAnchor.y - ph - offset;
    left = Math.max(8, Math.min(left, rect.width - pw - 8));
    top = Math.max(8, Math.min(top, rect.height - ph - 8));
    return {
      display: "block" as const,
      left,
      top,
      width: pw,
    };
  }, [popupOpen, popupAnchor]);

  return (
    <Box
      ref={wrapRef}
      onClick={() => onClosePopup()}
      sx={{
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid rgba(255, 215, 0, 0.3)",
        bgcolor: "rgba(0,0,0,0.35)",
        minHeight: { xs: 320, sm: 400, md: 480 },
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
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400" }}>
          Legend
        </Typography>
        {[
          { c: COLORS.noChapters, t: "No activity" },
          { c: COLORS.hasChaptersMid, t: "Moderate (chapters 1–4 or ref. leaders/members)" },
          { c: COLORS.hasChapters, t: "High (5+ chapters or strong ref. reach)" },
        ].map((item) => (
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
        <Typography variant="caption" color="text.secondary" sx={{ width: "100%", opacity: 0.85 }}>
          City file: each city counts 1 reference leader + remaining as members; summed by state for fill only.
        </Typography>
      </Box>

      <ComposableMap
        projection="geoAlbersUsa"
        width={900}
        height={520}
        projectionConfig={{ scale: 1000 }}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "min(74vh, 520px)",
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
          <Geographies geography={GEO_URL}>
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
                        stroke: selected ? COLORS.selected : COLORS.stroke,
                        strokeWidth: selected ? 1.5 : 0.6,
                        outline: "none",
                        cursor: code ? "pointer" : "default",
                      },
                      hover: {
                        fill: code ? base : base,
                        stroke: COLORS.selected,
                        strokeWidth: 1.2,
                        outline: "none",
                        filter: code ? "brightness(1.15)" : undefined,
                      },
                      pressed: {
                        fill: base,
                        stroke: COLORS.selected,
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

      {popupOpen ? (
        <Paper
          elevation={8}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            zIndex: 10,
            p: 2,
            bgcolor: "rgba(28,26,26,0.95)",
            border: "1px solid rgba(255, 215, 0, 0.35)",
            color: "grey.100",
            ...popupStyle,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
              {selectedStateCode}
            </Typography>
            <IconButton size="small" onClick={onClosePopup} aria-label="Close" sx={{ color: "grey.400" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {children}
        </Paper>
      ) : null}
    </Box>
  );
}
