"use client";

import {
  LOGIN_BACKGROUND_IMAGE,
  LOGIN_LOGO_LEFT_MARK,
  LOGIN_LOGO_WATERMARK,
} from "@/config/login";
import { flashpointYellow } from "@/theme/tokens";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import type { ReactNode } from "react";

const grayText = "#d1d5db";
const yellow = flashpointYellow;

export function ArmyAuthShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#1a191a",
        backgroundImage: `url(${LOGIN_BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 12, md: 24 },
          left: { xs: 8, md: 40 },
          opacity: { xs: 0.2, md: 0.28 },
          maxWidth: { xs: "58%", sm: "45%", md: "380px" },
          width: "18vw",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <Image
          src={LOGIN_LOGO_WATERMARK}
          alt=""
          width={420}
          height={120}
          style={{ width: "100%", height: "auto" }}
          priority={false}
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 0 },
          py: { xs: 3, md: 0 },
        }}
      >
        <Box
          sx={{
            textAlign: "left",
            color: yellow,
            flexShrink: 0,
            width: "100%",
            maxWidth: { xs: "100%", sm: 420, md: 480 },
            mb: { xs: 3, md: 0 },
            pr: { md: 2 },
            position: { md: "absolute" },
            left: { md: "2%" },
            top: { md: "50%" },
            transform: { md: "translateY(-50%)" },
            lineHeight: 1.12,
            display: { xs: "none", md: "block" },
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              lineHeight: 1.12,
              fontSize: {
                xs: "clamp(1.2rem, 5.2vw, 1.65rem)",
                sm: "clamp(1.45rem, 3.8vw, 2.1rem)",
                md: "4vw",
                lg: "55px",
                xl: "75px",
              },
              letterSpacing: { xs: "0.02em", md: "0.04em" },
            }}
          >
            BE WHO <br /> GOD CALLED <br />YOU TO BE.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            mx: "auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          {children}
          <Typography
            sx={{
              color: grayText,
              fontSize: "0.75rem",
              textAlign: "center",
              mt: 0.2,
            }}
          >
            Powered by Dreams Animation
          </Typography>
        </Box>
      </Box>

      <Typography
        component="p"
        variant="caption"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "block",
          px: 2,
          pb: 2,
          pt: 1,
          textAlign: "center",
          maxWidth: 720,
          mx: "auto",
          color: grayText,
          lineHeight: 1.5,
          fontSize: { xs: "0.62rem", sm: "0.68rem" },
        }}
      >
        This system is intended for use by authorized personnel only. By logging in, you are
        confirming that you have the necessary permission. All use of this system is monitored
        and recorded. Unauthorized access or misuse of confidential information may result in
        legal action.
      </Typography>
    </Box>
  );
}

export const authYellow = yellow;
export const authGrayText = grayText;
