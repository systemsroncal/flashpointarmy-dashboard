"use client";

import { MobilizeGroupStateFlag } from "@/components/mobilize/MobilizeGroupStateFlag";
import {
  MOBILIZE_CHAPTER_FEED_BANNER_ASPECT,
  mobilizeChapterBannerHeading,
} from "@/lib/mobilize/mobilize-chapter-cover";
import type { MobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";
import { Box, Stack, Typography } from "@mui/material";

type Props = {
  coverSrc: string;
  chapterName: string;
  stateInfo?: MobilizeGroupStateInfo | null;
};

export function MobilizeChapterFeedBanner({ coverSrc, chapterName, stateInfo }: Props) {
  const heading = mobilizeChapterBannerHeading(chapterName, stateInfo);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: MOBILIZE_CHAPTER_FEED_BANNER_ASPECT,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "rgba(0,0,0,0.35)",
      }}
    >
      <Box
        component="img"
        src={coverSrc}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
      {stateInfo ? (
        <Box sx={{ position: "absolute", top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 2 }}>
          <MobilizeGroupStateFlag state={stateInfo} size={72} />
        </Box>
      ) : null}
      <Stack
        alignItems="center"
        spacing={0.5}
        sx={{
          position: "absolute",
          top: { xs: 16, sm: 20 },
          left: 0,
          right: 0,
          zIndex: 2,
          px: 2,
        }}
      >
        <Box
          component="img"
          src="/logos/fp-army-chapters-white.png"
          alt="FP Army Chapters"
          sx={{
            height: { xs: 36, sm: 44, md: 52 },
            width: "auto",
            maxWidth: "min(92%, 420px)",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.45))",
          }}
        />
      </Stack>
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={0.25}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          px: 2,
          pt: { xs: 4, sm: 5 },
        }}
      >
        <Typography
          component="p"
          sx={{
            m: 0,
            fontWeight: 900,
            letterSpacing: { xs: 1, sm: 2 },
            color: "primary.main",
            fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" },
            lineHeight: 1.05,
            textAlign: "center",
            textShadow: "0 3px 18px rgba(0,0,0,0.65)",
          }}
        >
          {heading}
        </Typography>
        <Typography
          component="p"
          sx={{
            m: 0,
            fontWeight: 900,
            letterSpacing: { xs: 4, sm: 6 },
            color: "#fff",
            fontSize: { xs: "1.35rem", sm: "1.65rem", md: "1.85rem" },
            lineHeight: 1.1,
            textAlign: "center",
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
          }}
        >
          CHAPTER
        </Typography>
      </Stack>
    </Box>
  );
}
