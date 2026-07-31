import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

const DREAMS_ANIMATION_URL = "https://www.dreamsanimation.com/";

type Props = {
  sx?: SxProps<Theme>;
};

export function PoweredByDreamsAnimation({ sx }: Props) {
  return (
    <Typography
      component="a"
      href={DREAMS_ANIMATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: "text.secondary",
        fontSize: "0.75rem",
        textAlign: "center",
        textDecoration: "none",
        display: "block",
        "&:hover": {
          color: "primary.main",
          textDecoration: "underline",
        },
        ...sx,
      }}
    >
      Powered by Dreams Animation
    </Typography>
  );
}
