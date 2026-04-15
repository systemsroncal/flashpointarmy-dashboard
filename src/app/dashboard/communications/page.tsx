import { Paper, Typography } from "@mui/material";

export default function CommunicationsPage() {
  return (
    <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Communications
      </Typography>
      <Typography color="text.secondary">Module coming soon.</Typography>
    </Paper>
  );
}
