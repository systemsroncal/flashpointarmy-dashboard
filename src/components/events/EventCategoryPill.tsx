import { Box } from "@mui/material";

/** Category label: gold accent capsule (matches dashboard yellow borders / highlights). */
export function EventCategoryPill({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.75,
        py: 0.45,
        borderRadius: "3rem",
        bgcolor: "rgba(255,215,0,0.2)",
        border: "1px solid rgba(255,215,0,0.42)",
        color: "primary.main",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight: 1.25,
      }}
    >
      {label}
    </Box>
  );
}
