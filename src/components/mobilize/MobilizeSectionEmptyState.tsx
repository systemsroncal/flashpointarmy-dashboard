"use client";

import { mobilizeCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  message: string;
  imageSrc?: string;
  icon?: ReactNode;
  imageSize?: number;
};

export function MobilizeSectionEmptyState({
  message,
  imageSrc,
  icon,
  imageSize = 72,
}: Props) {
  const visual = imageSrc ? (
    <Box
      component="img"
      src={imageSrc}
      alt=""
      sx={{ width: imageSize, height: imageSize, objectFit: "contain", display: "block" }}
    />
  ) : (
    icon
  );

  return (
    <Card variant="outlined" sx={mobilizeCardSx}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "center", sm: "flex-start" }}
          spacing={1.5}
          useFlexGap
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Box sx={{ flexShrink: 0, display: "flex" }}>{visual}</Box>
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
