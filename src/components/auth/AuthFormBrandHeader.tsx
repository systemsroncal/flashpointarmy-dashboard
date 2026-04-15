"use client";

import { LOGIN_LOGO_FORM_ICON } from "@/config/login";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { LOGIN_LOGO_FORM_MARK } from "@/config/login";
import { authGrayText } from "./ArmyAuthShell";

export function AuthFormBrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
      
      <Box sx={{ width: "100%", height: { xs: "160px", sm: "190px", md: "230px" }, overflow: "hidden", minWidth: 0, pt: 0.25 }}>

      <Box
        sx={{
          position: "relative",
          width: "100%",   // ← already relative to parent; if you want px, pick a fixed number
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Image
          src={LOGIN_LOGO_FORM_MARK}
          alt=""
          fill
          sizes="64px"
          style={{ objectFit: "contain", padding: "10px" }}
          priority
        />
      </Box>
      </Box>
    </Box>
  );
}
