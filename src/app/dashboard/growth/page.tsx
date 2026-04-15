import { Paper, Typography } from "@mui/material";

export default function GrowthPage() {
  return (
    <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Growth
      </Typography>
      <Typography color="text.secondary">Module coming soon.</Typography>
    </Paper>
  );
}
