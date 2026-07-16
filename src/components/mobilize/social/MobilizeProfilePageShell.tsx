"use client";

import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Avatar, Box, Typography } from "@mui/material";
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
}: Props) {
  return (
    <Box>
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          mb: 2,
        }}
      >
        <Box
          component="img"
          src={coverSrc}
          alt=""
          sx={{ width: "100%", height: { xs: 140, sm: 200 }, objectFit: "cover", display: "block" }}
        />
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 0, position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "flex-end" },
              gap: 2,
              mt: -5,
              pb: 1,
            }}
          >
            <Avatar
              src={avatarSrc ? publicAssetSrc(avatarSrc) : undefined}
              alt=""
              sx={{
                width: 112,
                height: 112,
                border: "4px solid #fff",
                bgcolor: "#263238",
                fontSize: "2rem",
                fontWeight: 800,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {avatarFallback.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, pb: { sm: 1 } }}>
              <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {headerActions ? <Box sx={{ pb: { sm: 1 } }}>{headerActions}</Box> : null}
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
                      color: selected ? "#1565c0" : "#444",
                      borderBottom: selected ? "3px solid #1565c0" : "3px solid transparent",
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
      {children}
    </Box>
  );
}
