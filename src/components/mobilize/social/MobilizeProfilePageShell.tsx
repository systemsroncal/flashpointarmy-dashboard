"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { flashpointYellow } from "@/theme/tokens";
import { Avatar, Box, ThemeProvider, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Tab = { id: string; label: string };

type Props = {
  coverSrc: string;
  title: string;
  subtitle?: string | null;
  avatarSrc?: string | null;
  avatarFallback?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  headerActions?: ReactNode;
  children: ReactNode;
  /** Stretch children to fill viewport below the profile header (group detail tabs). */
  fillContent?: boolean;
};

export function MobilizeProfilePageShell({
  coverSrc,
  title,
  subtitle,
  avatarSrc,
  avatarFallback = "?",
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  children,
  fillContent = false,
}: Props) {
  const fallbackInitial =
    avatarFallback.trim().length > 1
      ? avatarFallback.trim().slice(0, 2).toUpperCase()
      : avatarFallback.charAt(0).toUpperCase();

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={
          fillContent
            ? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
            : undefined
        }
      >
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            mb: 2,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Box
              component="img"
              src={coverSrc}
              alt=""
              sx={{ width: "100%", height: { xs: 160, sm: 220 }, objectFit: "cover", display: "block" }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.72) 100%)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: { xs: 16, sm: 24 },
                right: { xs: 16, sm: 24 },
                bottom: { xs: 12, sm: 16 },
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  lineHeight={1.15}
                  sx={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
                  noWrap
                  title={title}
                >
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.88)", mt: 0.35, textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
                    noWrap
                    title={subtitle}
                  >
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>
              {headerActions ? (
                <Box sx={{ flexShrink: 0, pb: 0.25 }}>{headerActions}</Box>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3 }, pb: tabs?.length ? 0 : 1.5, position: "relative" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "flex-end" },
                gap: 2,
                mt: -6,
                pb: 0.5,
              }}
            >
              <Avatar
                src={avatarSrc ? publicAssetSrc(avatarSrc) : undefined}
                alt=""
                sx={{
                  width: { xs: 96, sm: 112 },
                  height: { xs: 96, sm: 112 },
                  border: "4px solid #fff",
                  bgcolor: "#0d0d0d",
                  color: flashpointYellow,
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                }}
              >
                {fallbackInitial}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, display: { xs: "block", sm: "none" }, pb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>
            </Box>

            {tabs?.length ? (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  mt: 1,
                  overflowX: "auto",
                }}
              >
                {tabs.map((t) => {
                  const selected = activeTab === t.id;
                  return (
                    <Box
                      key={t.id}
                      component="button"
                      type="button"
                      onClick={() => onTabChange?.(t.id)}
                      sx={{
                        border: "none",
                        bgcolor: "transparent",
                        cursor: "pointer",
                        px: 2,
                        py: 1.25,
                        fontWeight: selected ? 700 : 500,
                        color: selected ? "primary.main" : "text.secondary",
                        borderBottom: selected ? "3px solid" : "3px solid transparent",
                        borderBottomColor: selected ? "primary.main" : "transparent",
                        whiteSpace: "nowrap",
                        fontSize: "0.9rem",
                      }}
                    >
                      {t.label}
                    </Box>
                  );
                })}
              </Box>
            ) : null}
          </Box>
        </Box>
        <Box
          sx={
            fillContent
              ? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
              : undefined
          }
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
