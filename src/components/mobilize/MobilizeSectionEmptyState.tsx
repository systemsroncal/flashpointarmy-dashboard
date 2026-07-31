"use client";

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
  /** Icon above title (default on md+ is side-by-side). */
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
  layout = "sideBySide",
}: Props) {
  const heading = title || message || "Nothing to see here";
  const body = description ?? (title && message ? message : undefined);
  const isDark = surface === "dark";
  const titleColor = isDark ? "#e7e9ea" : "#0d0d0d";
  const bodyColor = isDark ? "#8b98a5" : "rgba(0,0,0,0.65)";
  const circleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const visual = imageSrc ? (
    <Box
      component="img"
      src={imageSrc}
      alt=""
      sx={{
        width: { xs: 72, sm: 88, md: 110 },
        height: { xs: 72, sm: 88, md: 110 },
        "@media (min-width: 1000px)": {
          width: 160,
          height: 160,
        },
        objectFit: "contain",
        display: "block",
      }}
    />
  ) : icon ? (
    <Box
      sx={{
        fontSize: { xs: 40, sm: 48, md: 56 },
        "@media (min-width: 1000px)": {
          fontSize: 72,
        },
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
  ) : null;

  const stacked = layout === "stacked";

  const content = (
    <Stack
      direction={stacked ? "column" : { xs: "column", md: "row" }}
      alignItems={stacked ? "center" : { xs: "center", md: "center" }}
      spacing={stacked ? 1.5 : { xs: 2, md: 3 }}
      useFlexGap
      sx={{
        textAlign: "center",
        maxWidth: fill ? 720 : undefined,
        mx: fill ? "auto" : undefined,
      }}
    >
      {visual ? (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: 96, sm: 112, md: 140 },
            height: { xs: 96, sm: 112, md: 140 },
            "@media (min-width: 1000px)": {
              width: 200,
              height: 200,
            },
            borderRadius: "50%",
            bgcolor: circleBg,
          }}
        >
          {visual}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ mb: body ? 1 : 0, letterSpacing: "-0.02em", color: titleColor }}
        >
          {heading}
        </Typography>
        {body ? (
          <Typography
            variant="body1"
            sx={{ lineHeight: 1.6, maxWidth: 480, color: bodyColor }}
          >
            {body}
          </Typography>
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
        py: 3,
        px: { xs: 2, md: 2.5 },
        borderRadius: 2,
        bgcolor: isDark ? "transparent" : "rgba(0,0,0,0.02)",
        border: isDark ? "none" : "1px dashed rgba(0,0,0,0.1)",
      }}
    >
      {content}
    </Box>
  );
}
