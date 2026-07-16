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
  /** Optional stats line (e.g. followers, member count). */
  meta?: ReactNode;
  avatarSrc?: string | null;
  avatarFallback?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  headerActions?: ReactNode;
  children: ReactNode;
  /** Stretch children to fill viewport below the profile header (group detail tabs). */
  fillContent?: boolean;
  /** Facebook-style blue tab underline for member profiles. */
  socialTabStyle?: boolean;
};

export function MobilizeProfilePageShell({
  coverSrc,
  title,
  subtitle,
  meta,
  avatarSrc,
  avatarFallback = "?",
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  children,
  fillContent = false,
  socialTabStyle = false,
}: Props) {
  const tabAccent = socialTabStyle ? "#1877f2" : undefined;
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
            mb: 1.5,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* Cover — no title overlay (Facebook-style) */}
          <Box sx={{ position: "relative", bgcolor: "#1a2744" }}>
            <Box
              component="img"
              src={coverSrc}
              alt=""
              sx={{
                width: "100%",
                height: { xs: 180, sm: 240, md: 300 },
                objectFit: "cover",
                display: "block",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.18) 100%)",
                pointerEvents: "none",
              }}
            />
          </Box>

          {/* Identity row: avatar + name + actions */}
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              pb: tabs?.length ? 0 : { xs: 2, sm: 2.5 },
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "flex-end" },
                gap: { xs: 1.5, md: 2 },
                mt: { xs: -5, sm: -6, md: -7 },
                pt: { xs: 0, md: 0.5 },
              }}
            >
              <Avatar
                src={avatarSrc ? publicAssetSrc(avatarSrc) : undefined}
                alt=""
                sx={{
                  width: { xs: 96, sm: 112, md: 132 },
                  height: { xs: 96, sm: 112, md: 132 },
                  border: "4px solid #fff",
                  bgcolor: "#0d0d0d",
                  color: flashpointYellow,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  fontWeight: 800,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}
              >
                {fallbackInitial}
              </Avatar>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  pb: { md: 0.75 },
                  pt: { xs: 0.25, md: 0 },
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color="text.primary"
                  lineHeight={1.15}
                  sx={{
                    letterSpacing: "-0.02em",
                    fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.75rem" },
                  }}
                  noWrap
                  title={title}
                >
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.35, lineHeight: 1.4 }}
                    noWrap
                    title={typeof subtitle === "string" ? subtitle : undefined}
                  >
                    {subtitle}
                  </Typography>
                ) : null}
                {meta ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, fontWeight: 500 }}
                  >
                    {meta}
                  </Typography>
                ) : null}
              </Box>

              {headerActions ? (
                <Box
                  sx={{
                    flexShrink: 0,
                    pb: { md: 0.75 },
                    width: { xs: "100%", md: "auto" },
                    display: "flex",
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {headerActions}
                </Box>
              ) : null}
            </Box>

            {tabs?.length ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  mt: 1.5,
                  overflowX: "auto",
                  mx: { xs: -2, sm: -3 },
                  px: { xs: 2, sm: 3 },
                }}
              >
                <Box sx={{ display: "flex", gap: 0.25, flex: 1, minWidth: 0 }}>
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
                          px: { xs: 1.5, sm: 2 },
                          py: 1.25,
                          fontWeight: selected ? 700 : 600,
                          color: selected
                            ? tabAccent ?? "primary.main"
                            : "text.secondary",
                          borderBottom: "3px solid",
                          borderBottomColor: selected
                            ? tabAccent ?? "primary.main"
                            : "transparent",
                          whiteSpace: "nowrap",
                          fontSize: "0.9rem",
                          flexShrink: 0,
                        }}
                      >
                        {t.label}
                      </Box>
                    );
                  })}
                </Box>
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
