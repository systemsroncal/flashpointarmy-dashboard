"use client";

import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  /** Bold heading (e.g. "No events") */
  title: string;
  /** Supporting copy below the title */
  description?: string;
  /** @deprecated Prefer title + description */
  message?: string;
  imageSrc?: string;
  icon?: ReactNode;
  /** Grow to fill the tab panel and center the empty state vertically */
  fill?: boolean;
  /** Truth-style dark feed vs light panels */
  surface?: "light" | "dark";
  /** Icon above title (default). Use sideBySide for wide layouts. */
  layout?: "stacked" | "sideBySide";
};

export function MobilizeSectionEmptyState({
  title,
  description,
  message,
  imageSrc,
  icon,
  fill = false,
  surface = "light",
  layout = "stacked",
}: Props) {
  const heading = title || message || "Nothing to see here yet";
  const body = description ?? (title && message ? message : undefined);
  const isDark = surface === "dark";
  const titleColor = isDark ? "#e7e9ea" : "#0d0d0d";
  const bodyColor = isDark ? "#8b98a5" : "rgba(0,0,0,0.62)";
  const circleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(24,119,242,0.08)";
  const accentRing = isDark ? "rgba(255,255,255,0.08)" : "rgba(24,119,242,0.16)";

  const resolvedIcon =
    icon ??
    (!imageSrc ? (
      <InboxOutlinedIcon sx={{ fontSize: "inherit", color: isDark ? "rgba(255,255,255,0.45)" : "#1877f2" }} />
    ) : null);

  const visual = imageSrc ? (
    <Box
      component="img"
      src={imageSrc}
      alt=""
      sx={{
        width: { xs: 72, sm: 88, md: 104 },
        height: { xs: 72, sm: 88, md: 104 },
        objectFit: "contain",
        display: "block",
      }}
    />
  ) : resolvedIcon ? (
    <Box
      sx={{
        fontSize: { xs: 40, sm: 48, md: 56 },
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDark ? "rgba(255,255,255,0.5)" : "#1877f2",
      }}
    >
      {resolvedIcon}
    </Box>
  ) : null;

  const stacked = layout === "stacked";

  const content = (
    <Stack
      direction={stacked ? "column" : { xs: "column", md: "row" }}
      alignItems="center"
      spacing={stacked ? 1.75 : { xs: 2, md: 3 }}
      useFlexGap
      sx={{
        textAlign: "center",
        maxWidth: fill ? 560 : 480,
        mx: "auto",
      }}
    >
      {visual ? (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: 88, sm: 104, md: 120 },
            height: { xs: 88, sm: 104, md: 120 },
            borderRadius: "50%",
            bgcolor: circleBg,
            boxShadow: `inset 0 0 0 1px ${accentRing}`,
          }}
        >
          {visual}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0, px: 1 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            mb: body ? 1 : 0,
            letterSpacing: "-0.02em",
            color: titleColor,
            textWrap: "balance",
          }}
        >
          {heading}
        </Typography>
        {body ? (
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.55,
              maxWidth: 420,
              mx: "auto",
              color: bodyColor,
              textWrap: "pretty",
            }}
          >
            {body}
          </Typography>
        ) : null}
        {stacked && visual ? (
          <Box
            sx={{
              mt: 2,
              mx: "auto",
              width: 36,
              height: 4,
              borderRadius: 99,
              bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(24,119,242,0.25)",
            }}
            aria-hidden
          />
        ) : null}
      </Box>
    </Stack>
  );

  if (fill) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 240, md: 320 },
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 3 },
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 3.5,
        px: { xs: 2, md: 2.5 },
        borderRadius: 2.5,
        bgcolor: isDark ? "transparent" : "#fff",
        border: isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
        boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {content}
    </Box>
  );
}
