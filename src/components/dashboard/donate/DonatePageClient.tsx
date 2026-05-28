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
      bgcolor: "#26262b",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.45)",
      buttonBg: "#facc15",
      buttonColor: "#111",
      buttonHover: "#fde047",
    };
  }
  return {
    bgcolor: "#fff",
    color: "#111",
    border: "1px solid transparent",
    buttonBg: "#facc15",
    buttonColor: "#111",
    buttonHover: "#fde047",
  };
}

function PartnershipCard({ preset }: { preset: DonationAmountPreset }) {
  const palette = cardPalette(preset.card_style);
  const amountLabel = formatUsdFromCents(preset.amount_cents);
  const recommended = preset.is_recommended;

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "14px",
        border: palette.border,
        bgcolor: palette.bgcolor,
        color: palette.color,
        px: { xs: 2, sm: 3 },
        py: recommended ? { xs: 3.25, sm: 3.75 } : { xs: 3, sm: 3.25 },
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: "100%",
        boxShadow: preset.card_style === "accent" ? "none" : preset.card_style === "dark" ? "none" : "none",
      }}
    >
      {recommended ? (
        <Typography
          sx={{
            textAlign: "center",
            fontSize: { xs: "0.75rem", sm: "0.82rem" },
            fontStyle: "italic",
            fontWeight: 500,
            mb: 2,
          }}
        >
          † Recommended
        </Typography>
      ) : null}

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: "0.95rem", sm: "1.08rem" },
          textAlign: "center",
          mb: { xs: 2, sm: 2.5 },
          lineHeight: 1.25,
        }}
      >
        {packageTitle(preset)}
      </Typography>

      <Typography
        sx={{
          textAlign: "center",
          fontSize: { xs: "0.84rem", sm: "0.92rem" },
          lineHeight: 1.5,
          color: preset.card_style === "dark" ? "rgba(255,255,255,0.82)" : "rgba(17,17,17,0.68)",
          mb: 2,
          flexGrow: 1,
          px: 0.5,
        }}
      >
        {preset.description?.trim() || "Support the FlashPoint Army mission."}
      </Typography>

      <Box sx={{ py: { xs: 1.75, sm: 2.25 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, lineHeight: 1 }}>
          <Box component="span" sx={{ fontSize: { xs: "1.85rem", sm: "2.15rem" } }}>
            {amountLabel}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
              ml: 0.35,
              color: preset.card_style === "dark" ? "rgba(255,255,255,0.92)" : "rgba(17,17,17,0.88)",
            }}
          >
            /month
          </Box>
        </Typography>
      </Box>

      <Button
        component="a"
        href={packageUrl(preset)}
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        disableElevation
        sx={{
          alignSelf: "center",
          minWidth: { xs: 132, sm: 148 },
          minHeight: 44,
          borderRadius: 999,
          px: 3,
          fontWeight: 800,
          fontSize: { xs: "0.88rem", sm: "0.95rem" },
          bgcolor: palette.buttonBg,
          color: palette.buttonColor,
          touchAction: "manipulation",
          boxShadow: "none",
          textTransform: "none",
          "&:hover": { bgcolor: palette.buttonHover, boxShadow: "none" },
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

  const heroSrc = publicAssetSrc(DONATION_PARTNER_HERO_IMAGE);
  const introSrc = publicAssetSrc(DONATION_PARTNER_INTRO_IMAGE);

  return (
    <Box sx={{ bgcolor: "#0b0b0d", color: "#fff", mx: { xs: -2, sm: -3 }, mb: -4 }}>
      {/* Hero — full banner asset (logo + title baked into image) */}
      <Box
        component="img"
        src={heroSrc}
        alt="Partnership — Advance the mission"
        sx={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: { xs: 320, sm: 420, md: "none" },
          objectFit: "cover",
        }}
      />

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
            component="img"
            src={introSrc}
            alt=""
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 360,
              height: "auto",
              mx: { xs: "auto", md: 0 },
              borderRadius: 2,
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
          />
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
      <Box sx={{ bgcolor: "#0b0b0d", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            component="h2"
            sx={{
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: "0.06em",
              fontSize: { xs: "1.55rem", md: "2rem" },
              mb: 1.5,
            }}
          >
            BE PART OF THE MISSION
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              color: "rgba(255,255,255,0.72)",
              maxWidth: 820,
              mx: "auto",
              mb: { xs: 3.5, md: 5 },
              lineHeight: 1.65,
              fontSize: { xs: "0.95rem", md: "1rem" },
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                alignItems: "center",
                maxWidth: 1180,
                mx: "auto",
              }}
            >
              {packages.map((preset) => (
                <PartnershipCard key={preset.id} preset={preset} />
              ))}
            </Box>
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
      <Container maxWidth="md" sx={{ py: 5, px: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Tax &amp; Contribution information</Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.68)",
            lineHeight: 1.7,
            fontSize: "0.92rem",
            maxWidth: 640,
            mx: "auto",
          }}
        >
          FlashPoint Army is a registered 501(c)(3) nonprofit organization. Your partnership contribution is
          tax-deductible to the fullest extent permitted by law. Upon giving, you will receive a confirmation
          receipt for your records.
        </Typography>
      </Container>
    </Box>
  );
}
