"use client";

import {
  DONATION_DEFAULT_CHECKOUT_URL,
  DONATION_PARTNER_HERO_IMAGE,
  DONATION_PARTNER_INTRO_IMAGE,
} from "@/lib/donations/constants";
import { formatUsdFromCents } from "@/lib/donations/format";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import type { DonationAmountPreset } from "@/types/donations";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useMemo } from "react";

type Props = {
  presets: DonationAmountPreset[];
};

function packageTitle(p: DonationAmountPreset): string {
  return p.title?.trim() || p.label;
}

function packageUrl(p: DonationAmountPreset): string {
  const url = p.checkout_url?.trim();
  return url || DONATION_DEFAULT_CHECKOUT_URL;
}

function cardPalette(style: DonationAmountPreset["card_style"]) {
  if (style === "accent") {
    return {
      bgcolor: "#facc15",
      color: "#111",
      border: "1px solid #facc15",
      buttonBg: "#fff",
      buttonColor: "#111",
      buttonHover: "#f3f4f6",
    };
  }
  if (style === "dark") {
    return {
      bgcolor: "#1a1a1e",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.35)",
      buttonBg: "#facc15",
      buttonColor: "#111",
      buttonHover: "#fde047",
    };
  }
  return {
    bgcolor: "#fff",
    color: "#111",
    border: "1px solid rgba(0,0,0,0.08)",
    buttonBg: "#facc15",
    buttonColor: "#111",
    buttonHover: "#fde047",
  };
}

function PartnershipCard({ preset }: { preset: DonationAmountPreset }) {
  const palette = cardPalette(preset.card_style);
  const amountLabel = formatUsdFromCents(preset.amount_cents);

  return (
    <Box
      sx={{
        position: "relative",
        flex: "1 1 220px",
        minWidth: { xs: "100%", sm: 220 },
        maxWidth: { xs: "100%", lg: 280 },
        borderRadius: 2,
        border: palette.border,
        bgcolor: palette.bgcolor,
        color: palette.color,
        px: 2.5,
        py: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 320,
        boxShadow:
          preset.card_style === "accent"
            ? "0 12px 32px rgba(250,204,21,0.18)"
            : "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      {preset.is_recommended ? (
        <Typography
          sx={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "0.8rem",
            fontStyle: "italic",
            opacity: 0.85,
          }}
        >
          ✝ Recommended
        </Typography>
      ) : null}

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1.05rem",
          textAlign: "center",
          mt: preset.is_recommended ? 2.5 : 0,
          mb: 1.5,
          lineHeight: 1.25,
        }}
      >
        {packageTitle(preset)}
      </Typography>

      <Typography
        sx={{
          textAlign: "center",
          fontSize: "0.92rem",
          lineHeight: 1.45,
          opacity: preset.card_style === "dark" ? 0.88 : 0.72,
          mb: 2.5,
          flexGrow: 1,
        }}
      >
        {preset.description?.trim() || "Support the FlashPoint Army mission."}
      </Typography>

      <Typography sx={{ textAlign: "center", fontWeight: 800, mb: 2 }}>
        <Box component="span" sx={{ fontSize: "2rem", lineHeight: 1 }}>
          {amountLabel}
        </Box>
        <Box component="span" sx={{ fontSize: "0.95rem", fontWeight: 600, ml: 0.5 }}>
          /month
        </Box>
      </Typography>

      <Button
        component="a"
        href={packageUrl(preset)}
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        disableElevation
        sx={{
          alignSelf: "center",
          minWidth: 148,
          minHeight: 48,
          borderRadius: 999,
          px: 3,
          fontWeight: 800,
          bgcolor: palette.buttonBg,
          color: palette.buttonColor,
          touchAction: "manipulation",
          "&:hover": { bgcolor: palette.buttonHover },
        }}
      >
        Join Now
      </Button>
    </Box>
  );
}

export function DonatePageClient({ presets }: Props) {
  const packages = useMemo(
    () =>
      presets
        .filter((p) => p.is_enabled && !p.is_custom_amount)
        .sort((a, b) => a.sort_order - b.sort_order),
    [presets]
  );

  return (
    <Box sx={{ bgcolor: "#0b0b0d", color: "#fff", mx: { xs: -2, sm: -3 }, mb: -4 }}>
      {/* Hero */}
      <Box sx={{ position: "relative", minHeight: { xs: 280, md: 360 }, overflow: "hidden" }}>
        <Image
          src={publicAssetSrc(DONATION_PARTNER_HERO_IMAGE)}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
          unoptimized
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.42)",
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: { xs: 280, md: 360 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
            py: 4,
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <Image
              src="/logos/Dashboard-Logo.svg"
              alt="FP Army Chapters"
              width={72}
              height={72}
              unoptimized
            />
          </Box>
          <Typography sx={{ letterSpacing: "0.35em", fontWeight: 700, fontSize: "0.95rem" }}>
            FP ARMY
          </Typography>
          <Typography sx={{ letterSpacing: "0.45em", fontSize: "0.72rem", opacity: 0.85, mb: 2 }}>
            CHAPTERS
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Segoe Script", "Brush Script MT", cursive',
              fontSize: { xs: "3rem", md: "4.5rem" },
              lineHeight: 1,
              fontWeight: 400,
              mb: 1,
            }}
          >
            Partnership
          </Typography>
          <Typography sx={{ opacity: 0.9, fontSize: "1rem" }}>Advance the mission.</Typography>
        </Container>
      </Box>

      {/* Intro */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 360px) 1fr" },
            gap: { xs: 3, md: 5 },
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "4/5",
              maxWidth: 360,
              mx: { xs: "auto", md: 0 },
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
          >
            <Image
              src={publicAssetSrc(DONATION_PARTNER_INTRO_IMAGE)}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 360px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </Box>
          <Stack spacing={2.25} sx={{ pt: { md: 1 } }}>
            <Typography
              component="h2"
              sx={{ fontWeight: 800, letterSpacing: "0.04em", fontSize: { xs: "1.35rem", md: "1.55rem" } }}
            >
              THIS IS WHERE COMMITMENT BEGINS.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.75 }}>
              This platform was built for those who refuse to sit on the sidelines. It exists for believers who
              understand that faith without action is incomplete — and that the hour we are living in demands more
              than casual participation.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.75 }}>
              This is not a spectator platform. It is a training ground. A mobilization hub. A place where
              conviction becomes movement — and movement becomes impact.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.75 }}>
              Partnership starts at just $1 per month. Every level exists to strengthen the infrastructure that
              supports training, mobilization, and discipleship across the nation.
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
              Strengthen the foundation. Become a partner today.
            </Typography>
          </Stack>
        </Box>
      </Container>

      {/* Packages */}
      <Box sx={{ bgcolor: "#101014", py: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            component="h2"
            sx={{
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontSize: { xs: "1.5rem", md: "1.85rem" },
              mb: 1.5,
            }}
          >
            BE PART OF THE MISSION
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              color: "rgba(255,255,255,0.72)",
              maxWidth: 760,
              mx: "auto",
              mb: 4,
              lineHeight: 1.65,
            }}
          >
            Your partnership helps sustain the infrastructure, training, and mobilization efforts that equip
            believers to stand firm in this generation.
          </Typography>

          {packages.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              Partnership packages are being configured. Please check back soon.
            </Typography>
          ) : (
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              useFlexGap
              sx={{ justifyContent: "center", alignItems: "stretch" }}
            >
              {packages.map((preset) => (
                <PartnershipCard key={preset.id} preset={preset} />
              ))}
            </Stack>
          )}

          <Typography
            sx={{
              textAlign: "center",
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.82rem",
              mt: 4,
              lineHeight: 1.6,
            }}
          >
            Partnership levels simply allow each individual to support the mission at the level they feel led and
            able to contribute.
          </Typography>
        </Container>
      </Box>

      {/* Tax footer */}
      <Container maxWidth="md" sx={{ py: 5, px: { xs: 2, sm: 3 } }}>
        <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Tax &amp; Contribution information</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.7, fontSize: "0.92rem" }}>
          FlashPoint Army is a registered 501(c)(3) nonprofit organization. Contributions are tax-deductible to
          the extent allowed by law. Please consult your tax advisor regarding your specific situation.
        </Typography>
      </Container>
    </Box>
  );
}
