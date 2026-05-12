import MapIcon from "@mui/icons-material/Map";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import Link from "next/link";

const MOBILIZE_PREFIX = "/dashboard/mobilize";

const cards = [
  { title: "Map & Groups", href: `${MOBILIZE_PREFIX}/map`, icon: <MapIcon sx={{ fontSize: 40 }} /> },
  { title: "My Groups", href: `${MOBILIZE_PREFIX}/my-groups`, icon: <Groups2OutlinedIcon sx={{ fontSize: 40 }} /> },
  {
    title: "Upcoming Activities",
    href: `${MOBILIZE_PREFIX}/activities`,
    icon: <EventAvailableOutlinedIcon sx={{ fontSize: 40 }} />,
  },
  { title: "Calendar", href: `${MOBILIZE_PREFIX}/calendar`, icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 40 }} /> },
  {
    title: "Notifications",
    href: `${MOBILIZE_PREFIX}/notifications`,
    icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: 40 }} />,
  },
];

export default function MobilizeHomePage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mobilize
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 640 }}>
        Coordinate reading groups, prayer circles, marches, and support networks. Mobilize events are
        separate from the main platform Gatherings module.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {cards.map((c) => (
          <Card key={c.href} variant="outlined" sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
            <CardActionArea component={Link} href={c.href}>
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ color: "primary.main" }}>{c.icon}</Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {c.title}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
