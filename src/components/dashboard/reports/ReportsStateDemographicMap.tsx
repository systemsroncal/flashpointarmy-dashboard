"use client";

import { US_STATES, usStateById } from "@/data/usStates";
import type { PresenceDemographicRow } from "@/lib/reports/presence-daily-payload";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import { US_STATES_GEO_URL } from "@/lib/maps/us-states-geo";

const COLORS = {
  empty: "rgb(22, 22, 42)",
  stroke: "rgba(255, 255, 255, 0.2)",
  strokeHover: "rgba(255, 255, 255, 0.85)",
};

/** Hotjar-style cold → hot scale (blue → green → yellow → orange → red). */
const HEAT_STOPS: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0, rgb: [22, 22, 42] },
  { at: 0.1, rgb: [49, 54, 149] },
  { at: 0.28, rgb: [69, 117, 180] },
  { at: 0.45, rgb: [116, 173, 209] },
  { at: 0.58, rgb: [90, 200, 130] },
  { at: 0.72, rgb: [253, 219, 38] },
  { at: 0.86, rgb: [245, 150, 40] },
  { at: 1, rgb: [215, 25, 28] },
];

function heatFill(count: number, max: number): string {
  if (count <= 0 || max <= 0) return COLORS.empty;
  const t = Math.min(1, count / max);
  for (let i = HEAT_STOPS.length - 1; i > 0; i--) {
    const hi = HEAT_STOPS[i];
    const lo = HEAT_STOPS[i - 1];
    if (t >= lo.at) {
      const span = hi.at - lo.at || 1;
      const p = (t - lo.at) / span;
      const r = Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * p);
      const g = Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * p);
      const b = Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * p);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return COLORS.empty;
}

function barColorForPercent(percent: number): string {
  return heatFill(percent, 100);
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
};

function HeatLegend({ maxCount }: { maxCount: number }) {
  return (
    <Box sx={{ mt: 1.5, px: 0.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Low activity
        </Typography>
        <Typography variant="caption" color="text.secondary">
          High activity
        </Typography>
      </Box>
      <Box
        sx={{
          height: 10,
          borderRadius: 0.5,
          background: `linear-gradient(90deg, ${HEAT_STOPS.map((s) => `rgb(${s.rgb.join(",")})`).join(", ")})`,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {maxCount} users
        </Typography>
      </Box>
    </Box>
  );
}

export function ReportsStateDemographicMap({
  rows,
  rangeLabel,
}: {
  rows: PresenceDemographicRow[];
  rangeLabel: string;
}) {
  const [hovered, setHovered] = useState<{ name: string; count: number } | null>(null);

  const countByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.state, r.activeUsers);
    return m;
  }, [rows]);

  const maxCount = useMemo(
    () => Math.max(1, ...rows.map((r) => r.activeUsers)),
    [rows]
  );

  const rankedList = useMemo(() => rows.slice(0, 12), [rows]);

  const fillForState = useCallback(
    (code: string | null) => {
      if (!code) return COLORS.empty;
      return heatFill(countByState.get(code) ?? 0, maxCount);
    },
    [countByState, maxCount]
  );

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Heat intensity reflects active dashboard users by profile state for{" "}
        <strong>{rangeLabel}</strong>. Cooler colors = fewer users; warmer = more.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box>
          <Box
            sx={{
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid rgba(255,215,0,0.22)",
              bgcolor: "rgba(0,0,0,0.35)",
              minHeight: 280,
              position: "relative",
            }}
          >
            {hovered ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  zIndex: 2,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: "rgba(0,0,0,0.82)",
                  border: "1px solid rgba(255,215,0,0.35)",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                  {hovered.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hovered.count} active user{hovered.count === 1 ? "" : "s"}
                </Typography>
              </Box>
            ) : null}
            <ComposableMap
              projection="geoAlbersUsa"
              width={800}
              height={460}
              projectionConfig={{ scale: 980 }}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <Geographies geography={US_STATES_GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const g = geo as RsmGeo;
                    const code = geographyToStateCode(g);
                    const count = code ? (countByState.get(code) ?? 0) : 0;
                    const base = fillForState(code);
                    const stateName =
                      code != null
                        ? (US_STATES.find((s) => s.code === code)?.name ?? code)
                        : (g.properties?.name ?? "Unknown");
                    return (
                      <Geography
                        key={g.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHovered({ name: stateName, count })}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: {
                            fill: base,
                            stroke: COLORS.stroke,
                            strokeWidth: 0.45,
                            outline: "none",
                            transition: "fill 0.2s ease",
                          },
                          hover: {
                            fill: base,
                            stroke: COLORS.strokeHover,
                            strokeWidth: 1.1,
                            outline: "none",
                            filter: count > 0 ? "brightness(1.15) saturate(1.1)" : "brightness(1.08)",
                            cursor: "pointer",
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
          <HeatLegend maxCount={maxCount} />
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
            Active users by state
          </Typography>
          {rankedList.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No state data for this period. Users need a profile state and at least one session.
            </Typography>
          ) : (
            <Stack spacing={1.75}>
              {rankedList.map((row) => (
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
                      "& .MuiLinearProgress-bar": {
                        bgcolor: barColorForPercent(
                          maxCount > 0 ? (row.activeUsers / maxCount) * 100 : 0
                        ),
                      },
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
