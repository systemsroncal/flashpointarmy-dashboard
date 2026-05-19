"use client";

import { US_STATES, usStateById } from "@/data/usStates";
import type { PresenceDemographicRow } from "@/lib/reports/presence-daily-payload";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const COLORS = {
  empty: "#1c1a1a",
  stroke: "rgba(255, 215, 0, 0.35)",
  bar: "#4cc9f0",
};

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

function heatFill(count: number, max: number): string {
  if (count <= 0 || max <= 0) return COLORS.empty;
  const t = count / max;
  if (t < 0.2) return "#1e3a5f";
  if (t < 0.45) return "#2563eb";
  if (t < 0.7) return "#38bdf8";
  return "#4cc9f0";
}

type RsmGeo = {
  rsmKey: string;
  id?: string | number;
  properties?: { name?: string };
};

export function ReportsStateDemographicMap({
  rows,
  rangeLabel,
}: {
  rows: PresenceDemographicRow[];
  rangeLabel: string;
}) {
  const countByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.state, r.activeUsers);
    return m;
  }, [rows]);

  const maxCount = useMemo(
    () => Math.max(1, ...rows.map((r) => r.activeUsers)),
    [rows]
  );

  const topList = useMemo(() => rows.slice(0, 8), [rows]);

  const fillForState = useCallback(
    (code: string | null) => {
      if (!code) return COLORS.empty;
      return heatFill(countByState.get(code) ?? 0, maxCount);
    },
    [countByState, maxCount]
  );

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, mb: 0.5 }}>
        Users by state (heatmap)
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Active dashboard users in the selected period ({rangeLabel}), grouped by profile state.
        Darker blue = more users.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid rgba(255,215,0,0.22)",
            bgcolor: "rgba(0,0,0,0.35)",
            minHeight: 280,
          }}
        >
          <ComposableMap
            projection="geoAlbersUsa"
            width={800}
            height={460}
            projectionConfig={{ scale: 980 }}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const g = geo as RsmGeo;
                  const code = geographyToStateCode(g);
                  const count = code ? (countByState.get(code) ?? 0) : 0;
                  const base = fillForState(code);
                  return (
                    <Geography
                      key={g.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: base,
                          stroke: COLORS.stroke,
                          strokeWidth: 0.55,
                          outline: "none",
                        },
                        hover: {
                          fill: base,
                          stroke: "rgba(255,215,0,0.75)",
                          strokeWidth: 1,
                          outline: "none",
                          filter: count > 0 ? "brightness(1.12)" : undefined,
                        },
                        pressed: { fill: base, outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </Box>

        <Box
          sx={{
            borderRadius: 1,
            border: "1px solid rgba(255,215,0,0.18)",
            bgcolor: "rgba(0,0,0,0.25)",
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Top states
          </Typography>
          {topList.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No state data for this period. Users need a profile state and at least one session.
            </Typography>
          ) : (
            <Stack spacing={1.75}>
              {topList.map((row) => (
                <Box key={row.state}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.stateName}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                        ({row.state})
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.activeUsers} · {row.percent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={row.percent}
                    sx={{
                      height: 7,
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": { bgcolor: COLORS.bar },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
