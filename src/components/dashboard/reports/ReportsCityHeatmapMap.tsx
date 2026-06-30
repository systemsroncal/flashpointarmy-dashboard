"use client";

import type { PresenceCityDemographicRow } from "@/lib/reports/presence-daily-payload";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

import { US_STATES_GEO_URL } from "@/lib/maps/us-states-geo";

const BASE_FILL = "rgb(18, 20, 32)";
const STATE_BORDER = "rgba(255, 215, 0, 0.72)";
const STATE_BORDER_WIDTH = 1.05;

const HEAT_STOPS: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0, rgb: [49, 54, 149] },
  { at: 0.25, rgb: [69, 117, 180] },
  { at: 0.45, rgb: [116, 173, 209] },
  { at: 0.58, rgb: [90, 200, 130] },
  { at: 0.72, rgb: [253, 219, 38] },
  { at: 0.86, rgb: [245, 150, 40] },
  { at: 1, rgb: [215, 25, 28] },
];

function heatRgb(count: number, max: number): string {
  if (max <= 0) return `rgb(${HEAT_STOPS[0].rgb.join(",")})`;
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
  return `rgb(${HEAT_STOPS[0].rgb.join(",")})`;
}

function barColorForPercent(percent: number): string {
  return heatRgb(percent, 100);
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
          {maxCount} users / city
        </Typography>
      </Box>
    </Box>
  );
}

export function ReportsCityHeatmapMap({
  rows,
  rangeLabel,
}: {
  rows: PresenceCityDemographicRow[];
  rangeLabel: string;
}) {
  const [hovered, setHovered] = useState<PresenceCityDemographicRow | null>(null);

  const maxCount = useMemo(() => Math.max(1, ...rows.map((r) => r.activeUsers)), [rows]);
  const rankedList = useMemo(() => rows.slice(0, 12), [rows]);

  const markerRadius = useCallback(
    (count: number) => 14 + (count / maxCount) * 38,
    [maxCount]
  );

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Heat blobs are placed by <strong>profile city</strong> (not full state fill) for{" "}
        <strong>{rangeLabel}</strong>. State outlines stay visible on top; warmer colors mark cities
        with active users.
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
                  {hovered.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hovered.activeUsers} active user{hovered.activeUsers === 1 ? "" : "s"}
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
              <defs>
                <filter id="reports-city-heat-blur" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="11" />
                </filter>
              </defs>

              <Geographies geography={US_STATES_GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const g = geo as RsmGeo;
                    return (
                      <Geography
                        key={`base-${g.rsmKey}`}
                        geography={geo}
                        style={{
                          default: {
                            fill: BASE_FILL,
                            stroke: "none",
                            outline: "none",
                          },
                          hover: { fill: BASE_FILL, stroke: "none", outline: "none" },
                          pressed: { fill: BASE_FILL, stroke: "none", outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {rows.map((row) => {
                const r = markerRadius(row.activeUsers);
                const fill = heatRgb(row.activeUsers, maxCount);
                return (
                  <Marker key={`${row.label}-${row.lng}-${row.lat}`} coordinates={[row.lng, row.lat]}>
                    <g
                      onMouseEnter={() => setHovered(row)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={r + 10}
                        fill="transparent"
                        stroke="none"
                        pointerEvents="all"
                      />
                      <circle
                        r={r}
                        fill={fill}
                        opacity={0.52}
                        stroke="none"
                        style={{ filter: "url(#reports-city-heat-blur)" }}
                        pointerEvents="none"
                      />
                      <circle
                        r={Math.max(3, r * 0.18)}
                        fill={fill}
                        opacity={0.95}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={0.5}
                        pointerEvents="none"
                      />
                    </g>
                  </Marker>
                );
              })}

              <Geographies geography={US_STATES_GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const g = geo as RsmGeo;
                    const borderOnly = {
                      fill: "none" as const,
                      outline: "none" as const,
                      pointerEvents: "none" as const,
                    };
                    return (
                      <g key={`border-${g.rsmKey}`}>
                        <Geography
                          geography={geo}
                          style={{
                            default: {
                              ...borderOnly,
                              stroke: "rgba(0, 0, 0, 0.75)",
                              strokeWidth: STATE_BORDER_WIDTH + 0.55,
                            },
                            hover: {
                              ...borderOnly,
                              stroke: "rgba(0, 0, 0, 0.75)",
                              strokeWidth: STATE_BORDER_WIDTH + 0.55,
                            },
                            pressed: {
                              ...borderOnly,
                              stroke: "rgba(0, 0, 0, 0.75)",
                              strokeWidth: STATE_BORDER_WIDTH + 0.55,
                            },
                          }}
                        />
                        <Geography
                          geography={geo}
                          style={{
                            default: {
                              ...borderOnly,
                              stroke: STATE_BORDER,
                              strokeWidth: STATE_BORDER_WIDTH,
                            },
                            hover: {
                              ...borderOnly,
                              stroke: STATE_BORDER,
                              strokeWidth: STATE_BORDER_WIDTH,
                            },
                            pressed: {
                              ...borderOnly,
                              stroke: STATE_BORDER,
                              strokeWidth: STATE_BORDER_WIDTH,
                            },
                          }}
                        />
                      </g>
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
            Active users by city
          </Typography>
          {rankedList.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No city data for this period. Users need a profile city and state plus at least one
              session.
            </Typography>
          ) : (
            <Stack spacing={1.75}>
              {rankedList.map((row) => (
                <Box key={row.label}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.city}
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
